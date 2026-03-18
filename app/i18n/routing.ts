import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "pt"],
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: {
    name: "tca-locale",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];
