import {NextResponse} from "next/server";

type RateLimitPolicy = {
  bucket: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

const DEFAULT_SEARCH_LIMIT = 30;
const DEFAULT_SEARCH_WINDOW_MS = 60_000;
const DEFAULT_SEMANTIC_SEARCH_LIMIT = 10;
const DEFAULT_SEMANTIC_SEARCH_WINDOW_MS = 60_000;
const DEFAULT_ARTICLE_LIMIT = 120;
const DEFAULT_ARTICLE_WINDOW_MS = 60_000;
const MAX_STORE_ENTRIES = 10_000;

const globalForRateLimit = globalThis as typeof globalThis & {
  __tcaRateLimitStore?: Map<string, RateLimitEntry>;
};

const store = globalForRateLimit.__tcaRateLimitStore ?? new Map<string, RateLimitEntry>();
globalForRateLimit.__tcaRateLimitStore = store;

export const SEARCH_RATE_LIMIT = createPolicy("search", {
  limit: DEFAULT_SEARCH_LIMIT,
  windowMs: DEFAULT_SEARCH_WINDOW_MS,
});

export const SEMANTIC_SEARCH_RATE_LIMIT = createPolicy("semantic_search", {
  limit: DEFAULT_SEMANTIC_SEARCH_LIMIT,
  windowMs: DEFAULT_SEMANTIC_SEARCH_WINDOW_MS,
});

export const ARTICLE_RATE_LIMIT = createPolicy("article", {
  limit: DEFAULT_ARTICLE_LIMIT,
  windowMs: DEFAULT_ARTICLE_WINDOW_MS,
});

export function checkRateLimit(
  request: Request,
  policy: RateLimitPolicy,
): RateLimitDecision {
  const now = Date.now();
  if (process.env.NODE_ENV !== "production") {
    return {
      allowed: true,
      limit: policy.limit,
      remaining: policy.limit,
      resetAt: now + policy.windowMs,
      retryAfterSeconds: 0,
    };
  }

  pruneExpiredEntries(now);

  const clientIp = getClientIp(request);
  const key = `${policy.bucket}:${clientIp}`;
  const currentEntry = store.get(key);

  if (!currentEntry || currentEntry.resetAt <= now) {
    const nextEntry = {
      count: 1,
      resetAt: now + policy.windowMs,
    };
    store.set(key, nextEntry);
    return {
      allowed: true,
      limit: policy.limit,
      remaining: Math.max(policy.limit - 1, 0),
      resetAt: nextEntry.resetAt,
      retryAfterSeconds: 0,
    };
  }

  if (currentEntry.count >= policy.limit) {
    return {
      allowed: false,
      limit: policy.limit,
      remaining: 0,
      resetAt: currentEntry.resetAt,
      retryAfterSeconds: secondsUntil(currentEntry.resetAt, now),
    };
  }

  currentEntry.count += 1;
  store.set(key, currentEntry);
  return {
    allowed: true,
    limit: policy.limit,
    remaining: Math.max(policy.limit - currentEntry.count, 0),
    resetAt: currentEntry.resetAt,
    retryAfterSeconds: 0,
  };
}

export function jsonWithRateLimit(
  payload: object,
  rateLimit: RateLimitDecision,
  init?: ResponseInit,
) {
  const response = NextResponse.json(payload, init);
  attachRateLimitHeaders(response.headers, rateLimit);
  return response;
}

function attachRateLimitHeaders(headers: Headers, rateLimit: RateLimitDecision) {
  headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
  if (!rateLimit.allowed) {
    headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
  }
}

function createPolicy(
  bucket: string,
  defaults: {
    limit: number;
    windowMs: number;
  },
): RateLimitPolicy {
  const envPrefix = bucket.toUpperCase();
  return {
    bucket,
    limit: parsePositiveInteger(
      process.env[`RATE_LIMIT_${envPrefix}_LIMIT`],
      defaults.limit,
    ),
    windowMs: parsePositiveInteger(
      process.env[`RATE_LIMIT_${envPrefix}_WINDOW_MS`],
      defaults.windowMs,
    ),
  };
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

function parsePositiveInteger(rawValue: string | undefined, fallback: number): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function secondsUntil(resetAt: number, now: number): number {
  return Math.max(Math.ceil((resetAt - now) / 1000), 1);
}

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }

  if (store.size <= MAX_STORE_ENTRIES) {
    return;
  }

  const overflow = store.size - MAX_STORE_ENTRIES;
  let removed = 0;
  for (const key of store.keys()) {
    store.delete(key);
    removed += 1;
    if (removed >= overflow) {
      break;
    }
  }
}
