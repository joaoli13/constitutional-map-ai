"use client";

import {useState} from "react";
import {useLocale, useTranslations} from "next-intl";

import type {AppLocale} from "@/i18n/routing";
import {countrySearchIncludes, getCountryDisplayName} from "@/lib/country-names";
import {COUNTRY_PRESETS} from "@/lib/presets";
import type {CountryIndexRecord} from "@/lib/types";

type OrderKey = "name" | "region" | "articles";

type ControlPanelProps = {
  countries: CountryIndexRecord[];
  selectedCountries: string[];
  loadingCountries: string[];
  globalClusterCount: number;
  countryColors: Record<string, string>;
  onToggleCountry: (countryCode: string) => void;
  onAddCountries: (countryCodes: string[]) => void;
  onClearCountries: () => void;
};

export default function ControlPanel({
  countries,
  selectedCountries,
  loadingCountries,
  globalClusterCount,
  countryColors,
  onToggleCountry,
  onAddCountries,
  onClearCountries,
}: ControlPanelProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Atlas.ControlPanel");
  const presetT = useTranslations("Atlas.Presets");
  const [filterValue, setFilterValue] = useState("");
  const [orderBy, setOrderBy] = useState<OrderKey>("name");

  const availableCountries = countries.filter((country) => country.has_data);
  const presetEntries = [
    {id: "g7", codes: COUNTRY_PRESETS.g7},
    {id: "g20", codes: COUNTRY_PRESETS.g20},
    {id: "brics", codes: COUNTRY_PRESETS.brics},
    {id: "eu", codes: COUNTRY_PRESETS.eu},
    {id: "asean", codes: COUNTRY_PRESETS.asean},
    {id: "au", codes: COUNTRY_PRESETS.au},
    {id: "all", codes: availableCountries.map((country) => country.code)},
  ] as const;

  const filteredCountries = availableCountries
    .map((country) => ({
      country,
      display: getCountryDisplayName(country, locale),
    }))
    .filter(({country, display}) =>
      countrySearchIncludes(`${display.searchText} ${country.region}`, filterValue),
    )
    .sort((left, right) => {
      if (orderBy === "region") {
        return `${left.country.region}${left.display.sortName}`.localeCompare(
          `${right.country.region}${right.display.sortName}`,
        );
      }

      if (orderBy === "articles") {
        return right.country.article_count - left.country.article_count;
      }

      return left.display.sortName.localeCompare(right.display.sortName);
    });

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f7f2ea]/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        {t("eyebrow")}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-950">{t("title")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{t("body")}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-950 px-4 py-3 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">
            {t("selectedLabel")}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">{selectedCountries.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t("countryCountLabel")}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
            {availableCountries.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t("clusterCountLabel")}
          </p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-slate-900">
            {globalClusterCount}
          </p>
        </div>
      </div>

      <div className="mt-4.5">
        <p className="text-sm font-medium text-slate-700">{t("presetsLabel")}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {presetEntries.map((preset) => (
            <button
              key={preset.id}
              className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
              type="button"
              onClick={() =>
                onAddCountries(
                  preset.codes.filter((countryCode) =>
                    availableCountries.some((country) => country.code === countryCode),
                  ),
                )
              }
            >
              {presetT(preset.id)}
            </button>
          ))}
          <button
            className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
            type="button"
            onClick={onClearCountries}
          >
            {presetT("none")}
          </button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          placeholder={t("filterPlaceholder")}
          value={filterValue}
          onChange={(event) => setFilterValue(event.target.value)}
        />
        <select
          className="rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-500"
          value={orderBy}
          onChange={(event) => setOrderBy(event.target.value as OrderKey)}
          aria-label={t("orderLabel")}
        >
          <option value="name">{t("orderName")}</option>
          <option value="region">{t("orderRegion")}</option>
          <option value="articles">{t("orderArticles")}</option>
        </select>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
        <div className="max-h-[84px] overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-1.5">
          {selectedCountries.length === 0 ? (
            <span className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500">
              {t("noneSelected")}
            </span>
          ) : (
            selectedCountries.map((countryCode) => {
              const country = availableCountries.find(
                (value) => value.code === countryCode,
              );
              const display = country
                ? getCountryDisplayName(country, locale)
                : null;
              const color = countryColors[countryCode] ?? "#64748b";
              return (
                <button
                  key={countryCode}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white py-1.5 pl-2.5 pr-2 text-xs font-medium text-slate-800 transition hover:border-slate-400"
                  type="button"
                  onClick={() => onToggleCountry(countryCode)}
                  title={t("clickToRemove")}
                >
                  <span
                    className="size-2 rounded-full flex-shrink-0"
                    style={{backgroundColor: color}}
                  />
                  {display?.localizedName ?? countryCode}
                  <span className="ml-0.5 text-slate-500">×</span>
                </button>
              );
            })
          )}
          </div>
        </div>

        <div className="max-h-[320px] space-y-1.5 overflow-y-auto pr-0.5 overscroll-contain sm:max-h-[380px] xl:min-h-0 xl:flex-1 xl:max-h-none">
          {filteredCountries.map(({country, display}) => {
            const isSelected = selectedCountries.includes(country.code);
            const isLoading = loadingCountries.includes(country.code);
            const color = countryColors[country.code];
            return (
              <button
                key={country.code}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition ${
                  isSelected
                    ? "border-slate-800 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50"
                }`}
                type="button"
                onClick={() => onToggleCountry(country.code)}
              >
                <div className="flex items-center gap-2.5">
                  {isSelected && color ? (
                    <span
                      className="size-2 flex-shrink-0 rounded-full"
                      style={{backgroundColor: color}}
                    />
                  ) : (
                    <span className="size-2 flex-shrink-0 rounded-full border border-slate-300" />
                  )}
                  <div>
                    <p className="text-sm font-semibold leading-tight">
                      {display.localizedName}
                    </p>
                    {display.secondaryLabel ? (
                      <p className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                        {display.secondaryLabel}
                      </p>
                    ) : null}
                    <p className={`text-xs ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                      {country.code} · {country.region}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold tabular-nums ${isSelected ? "text-white" : "text-slate-700"}`}>
                    {country.article_count}
                  </p>
                  <p className={`text-[10px] uppercase tracking-wide ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {isLoading ? t("statusLoading") : t("articlesShort")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
