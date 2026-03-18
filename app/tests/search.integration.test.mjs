import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import test from "node:test";

const APP_DIR = process.cwd();
const HOST = "127.0.0.1";
const PORT = 3217;
const BASE_URL = `http://${HOST}:${PORT}`;
const NEXT_BIN = path.join(
  APP_DIR,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

loadEnvFile(path.join(APP_DIR, ".env.local"));
loadEnvFile(path.join(APP_DIR, "..", ".env.local"));

test(
  "GET /api/search returns ranked results from Neon",
  {timeout: 120_000},
  async (t) => {
    const dsn = process.env.NEON_DATABASE_URL;
    if (!dsn || dsn.includes("ep-xxx") || dsn.includes("user:password")) {
      t.skip("NEON_DATABASE_URL is not configured with a real database.");
      return;
    }

    const server = startNextServer();
    t.after(() => stopNextServer(server));

    await waitForSearchRoute(server);

    const response = await fetch(
      `${BASE_URL}/api/search?q=rights&country=BRA&limit=3`,
    );
    assert.equal(response.status, 200);
    assert.ok(response.headers.get("x-ratelimit-limit"));
    assert.ok(response.headers.get("x-ratelimit-remaining"));

    const payload = await response.json();
    assert.equal(payload.query, "rights");
    assert.ok(Array.isArray(payload.results));
    assert.ok(payload.results.length > 0);
    assert.ok(payload.total >= payload.results.length);
    assert.equal(payload.results[0].country_code, "BRA");
    assert.equal(typeof payload.results[0].rank, "number");

    const multiCountryResponse = await fetch(
      `${BASE_URL}/api/search?q=rights&countries=BRA,COL&limit=5`,
    );
    assert.equal(multiCountryResponse.status, 200);

    const multiCountryPayload = await multiCountryResponse.json();
    assert.ok(Array.isArray(multiCountryPayload.results));
    assert.ok(multiCountryPayload.results.length > 0);
    assert.ok(
      multiCountryPayload.results.every((result) =>
        ["BRA", "COL"].includes(result.country_code),
      ),
    );
  },
);

test(
  "GET /robots.txt disallows API and data crawling",
  {timeout: 120_000},
  async (t) => {
    const server = startNextServer();
    t.after(() => stopNextServer(server));

    await waitForRobotsRoute(server);

    const response = await fetch(`${BASE_URL}/robots.txt`);
    assert.equal(response.status, 200);

    const payload = await response.text();
    assert.match(payload, /User-Agent: \*/);
    assert.match(payload, /Disallow: \/api\//);
    assert.match(payload, /Disallow: \/data\//);
    assert.match(payload, /Crawl-delay: 10/);
  },
);

function startNextServer() {
  const child = spawn(
    process.execPath,
    [NEXT_BIN, "dev", "--hostname", HOST, "--port", String(PORT)],
    {
      cwd: APP_DIR,
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const logs = [];
  child.stdout.on("data", (chunk) => {
    logs.push(chunk.toString());
  });
  child.stderr.on("data", (chunk) => {
    logs.push(chunk.toString());
  });
  child.logs = logs;

  return child;
}

async function waitForSearchRoute(server) {
  const deadline = Date.now() + 90_000;
  let lastError = null;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `next dev exited early with code ${server.exitCode}\n${server.logs.join("")}`,
      );
    }

    try {
      const response = await fetch(`${BASE_URL}/api/search`);
      if (response.status === 400) {
        return;
      }

      lastError = new Error(`Unexpected readiness status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(1000);
  }

  throw new Error(
    `Timed out waiting for /api/search readiness.\n${String(lastError ?? "")}\n${server.logs.join("")}`,
  );
}

async function waitForRobotsRoute(server) {
  const deadline = Date.now() + 90_000;
  let lastError = null;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `next dev exited early with code ${server.exitCode}\n${server.logs.join("")}`,
      );
    }

    try {
      const response = await fetch(`${BASE_URL}/robots.txt`);
      if (response.status === 200) {
        return;
      }

      lastError = new Error(`Unexpected readiness status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await sleep(1000);
  }

  throw new Error(
    `Timed out waiting for /robots.txt readiness.\n${String(lastError ?? "")}\n${server.logs.join("")}`,
  );
}

async function stopNextServer(server) {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");
  await new Promise((resolve) => {
    server.once("exit", resolve);
    setTimeout(() => {
      if (server.exitCode === null) {
        server.kill("SIGKILL");
      }
    }, 5_000);
  });
}

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = stripQuotes(value);
    }
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
