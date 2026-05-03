"use client";

import {useTransition} from "react";
import {usePathname as useRawPathname} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {usePathname, useRouter} from "@/i18n/navigation";
import {routing, type AppLocale} from "@/i18n/routing";
import {getDiscoveryLanguageOptions} from "@/lib/discovery-language-options";

function persistLocalePreference(nextLocale: AppLocale) {
  localStorage.setItem("tca-locale", nextLocale);
  document.cookie = `tca-locale=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export default function LanguageSelector() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LanguageSelector");
  const router = useRouter();
  const pathname = usePathname();
  const rawPathname = useRawPathname();
  const [isPending, startTransition] = useTransition();
  const discoveryOptions = getDiscoveryLanguageOptions(rawPathname);
  const options = discoveryOptions ?? routing.locales.map((value) => ({
    locale: value,
    pathname,
  }));
  const isSingleOption = options.length <= 1;

  function handleLocaleChange(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    const discoveryTarget = discoveryOptions?.find(
      (option) => option.locale === nextLocale,
    );

    persistLocalePreference(nextLocale);

    startTransition(() => {
      router.replace(discoveryTarget?.pathname ?? pathname, {locale: nextLocale});
    });
  }

  return (
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <span>{t("label")}</span>
      <select
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm outline-none transition focus:border-slate-500"
        value={locale}
        onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
        disabled={isPending || isSingleOption}
      >
        {options.map((option) => (
          <option key={option.locale} value={option.locale}>
            {t(option.locale)}
          </option>
        ))}
      </select>
    </label>
  );
}
