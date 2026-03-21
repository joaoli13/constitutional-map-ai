import assert from "node:assert/strict";
import test from "node:test";

import {
  WELCOME_ONBOARDING_DISMISSED_KEY,
  dismissWelcomeOnboarding,
  isWelcomeOnboardingDismissed,
  isWelcomeOnboardingHomePath,
  shouldAutoOpenWelcomeOnboarding,
} from "../lib/welcome-onboarding.ts";

test("home-path detection accepts localized root and ignores trailing slash", () => {
  assert.equal(isWelcomeOnboardingHomePath("/en", ["en", "pt"]), true);
  assert.equal(isWelcomeOnboardingHomePath("/pt/", ["en", "pt"]), true);
});

test("home-path detection rejects non-home localized routes", () => {
  assert.equal(isWelcomeOnboardingHomePath("/en/share/123", ["en", "pt"]), false);
  assert.equal(isWelcomeOnboardingHomePath("/en/about", ["en", "pt"]), false);
});

test("dismissal helpers persist and read the onboarding state", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };

  assert.equal(isWelcomeOnboardingDismissed(storage), false);
  dismissWelcomeOnboarding(storage);
  assert.equal(store.get(WELCOME_ONBOARDING_DISMISSED_KEY), "1");
  assert.equal(isWelcomeOnboardingDismissed(storage), true);
});

test("auto-open only happens on localized home routes when not yet dismissed", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };

  assert.equal(
    shouldAutoOpenWelcomeOnboarding({
      pathname: "/en",
      locales: ["en", "pt"],
      storage,
    }),
    true,
  );

  dismissWelcomeOnboarding(storage);

  assert.equal(
    shouldAutoOpenWelcomeOnboarding({
      pathname: "/en",
      locales: ["en", "pt"],
      storage,
    }),
    false,
  );

  assert.equal(
    shouldAutoOpenWelcomeOnboarding({
      pathname: "/en/share/abc",
      locales: ["en", "pt"],
      storage: undefined,
    }),
    false,
  );
});
