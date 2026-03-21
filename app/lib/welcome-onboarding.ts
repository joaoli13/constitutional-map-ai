type StorageLike = Pick<Storage, "getItem" | "setItem">;

export const WELCOME_ONBOARDING_DISMISSED_KEY = "tca-welcome-onboarding-dismissed";

function normalizePathname(pathname: string): string {
  if (!pathname) {
    return "/";
  }

  const withoutQuery = pathname.split("?")[0] ?? pathname;
  const normalized = withoutQuery.replace(/\/+$/, "");
  return normalized || "/";
}

export function isWelcomeOnboardingHomePath(
  pathname: string,
  locales: readonly string[],
): boolean {
  const normalized = normalizePathname(pathname);
  return locales.some((locale) => normalized === `/${locale}`);
}

export function isWelcomeOnboardingDismissed(storage?: StorageLike | null): boolean {
  return storage?.getItem(WELCOME_ONBOARDING_DISMISSED_KEY) === "1";
}

export function dismissWelcomeOnboarding(storage?: StorageLike | null): void {
  storage?.setItem(WELCOME_ONBOARDING_DISMISSED_KEY, "1");
}

export function shouldAutoOpenWelcomeOnboarding({
  pathname,
  locales,
  storage,
}: {
  pathname: string;
  locales: readonly string[];
  storage?: StorageLike | null;
}): boolean {
  return (
    isWelcomeOnboardingHomePath(pathname, locales)
    && !isWelcomeOnboardingDismissed(storage)
  );
}
