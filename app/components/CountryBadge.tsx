"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";
import {useLocale} from "next-intl";

import type {AppLocale} from "@/i18n/routing";
import {getCountryDisplayName} from "@/lib/country-names";
import type {CountryIndexRecord} from "@/lib/types";

const CountryIndexContext = createContext<Record<string, CountryIndexRecord>>({});

type CountryIndexProviderProps = {
  countries: CountryIndexRecord[];
  children: ReactNode;
};

type CountryBadgeProps = {
  countryCode: string;
  countryName?: string;
  tone?: "slate" | "emerald";
  size?: "xs" | "sm";
  className?: string;
};

export function CountryIndexProvider({
  countries,
  children,
}: CountryIndexProviderProps) {
  const countryByCode = useMemo(
    () => Object.fromEntries(countries.map((country) => [country.code, country])),
    [countries],
  );

  return (
    <CountryIndexContext.Provider value={countryByCode}>
      {children}
    </CountryIndexContext.Provider>
  );
}

export function CountryBadge({
  countryCode,
  countryName,
  tone = "slate",
  size = "xs",
  className = "",
}: CountryBadgeProps) {
  const locale = useLocale() as AppLocale;
  const countryByCode = useContext(CountryIndexContext);
  const country = countryByCode[countryCode];
  const display = country ? getCountryDisplayName(country, locale) : null;
  const flagEmoji = toFlagEmoji(country?.iso_alpha2);
  const toneClass =
    tone === "emerald" ? "bg-emerald-900 text-white" : "bg-slate-950 text-white";
  const sizeClass =
    size === "sm" ? "gap-1.5 px-2.5 py-1 text-xs" : "gap-1 px-2 py-1 text-xs";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full font-semibold",
        toneClass,
        sizeClass,
        className,
      ].join(" ")}
      title={display?.localizedName ?? countryName ?? country?.name ?? countryCode}
    >
      {flagEmoji ? <span aria-hidden="true">{flagEmoji}</span> : null}
      <span>{countryCode}</span>
    </span>
  );
}

export function useCountryIndex() {
  return useContext(CountryIndexContext);
}

export function toFlagEmoji(isoAlpha2?: string | null): string | null {
  const normalized = isoAlpha2?.trim().toUpperCase();
  if (!normalized || !/^[A-Z]{2}$/.test(normalized)) {
    return null;
  }

  return String.fromCodePoint(
    ...normalized.split("").map((char) => 127397 + char.charCodeAt(0)),
  );
}
