"use client";

import {useTransition} from "react";
import {useLocale, useTranslations} from "next-intl";

import {usePathname, useRouter} from "@/i18n/navigation";
import {routing, type AppLocale} from "@/i18n/routing";

export default function LanguageSelector() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("LanguageSelector");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    localStorage.setItem("tca-locale", nextLocale);
    document.cookie = `tca-locale=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;

    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <span>{t("label")}</span>
      <select
        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm outline-none transition focus:border-slate-500"
        value={locale}
        onChange={(event) => handleLocaleChange(event.target.value as AppLocale)}
        disabled={isPending}
      >
        {routing.locales.map((value) => (
          <option key={value} value={value}>
            {t(value)}
          </option>
        ))}
      </select>
    </label>
  );
}
