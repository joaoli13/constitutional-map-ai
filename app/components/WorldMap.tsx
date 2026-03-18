"use client";

import {useState} from "react";
import {ZoomableGroup, ComposableMap, Geographies, Geography} from "react-simple-maps";
import {useTranslations} from "next-intl";

import {resolveCountryForGeography} from "@/lib/geo";
import type {CountryIndexRecord} from "@/lib/types";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type WorldMapProps = {
  countries: CountryIndexRecord[];
  selectedCountries: string[];
  loadingCountries: string[];
  countryColors: Record<string, string>;
  onToggleCountry: (countryCode: string) => void;
};

export default function WorldMap({
  countries,
  selectedCountries,
  loadingCountries,
  countryColors,
  onToggleCountry,
}: WorldMapProps) {
  const t = useTranslations("Atlas.WorldMap");
  const [mapPosition, setMapPosition] = useState({
    coordinates: [0, 18] as [number, number],
    zoom: 1,
  });
  const [tooltip, setTooltip] = useState<string | null>(null);

  function zoomBy(direction: "in" | "out") {
    setMapPosition((current) => ({
      ...current,
      zoom:
        direction === "in"
          ? Math.min(current.zoom * 1.4, 8)
          : Math.max(current.zoom / 1.4, 1),
    }));
  }

  return (
    <section className="flex h-full flex-col rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
            {t("eyebrow")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {t("title")}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            {t("body")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
            type="button"
            onClick={() => zoomBy("out")}
          >
            {t("zoomOut")}
          </button>
          <button
            className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
            type="button"
            onClick={() => zoomBy("in")}
          >
            {t("zoomIn")}
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(241,245,249,0.95),_rgba(226,232,240,0.92))]">
        <ComposableMap projection="geoEqualEarth" className="h-full w-full">
          <ZoomableGroup
            center={mapPosition.coordinates}
            zoom={mapPosition.zoom}
            onMoveEnd={(position) => {
              setMapPosition({
                coordinates: position.coordinates as [number, number],
                zoom: position.zoom,
              });
            }}
          >
            <Geographies geography={GEO_URL}>
              {({geographies}) =>
                geographies.map((geo) => {
                  const name =
                    typeof geo.properties.name === "string"
                      ? geo.properties.name
                      : "";
                  const country = resolveCountryForGeography(name, countries);
                  const countryCode = country?.code;
                  const isAvailable = Boolean(country?.has_data);
                  const isSelected =
                    !!countryCode && selectedCountries.includes(countryCode);
                  const isLoading =
                    !!countryCode && loadingCountries.includes(countryCode);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => {
                        if (isAvailable && countryCode) {
                          onToggleCountry(countryCode);
                          setTooltip(
                            t("selectedCountry", {
                              country: country.name,
                            }),
                          );
                        } else {
                          setTooltip(
                            t("unavailableCountry", {
                              country: name || t("unknownCountry"),
                            }),
                          );
                        }
                      }}
                      onMouseEnter={() =>
                        setTooltip(
                          isAvailable && country
                            ? t("availableCountry", {country: country.name})
                            : t("unavailableCountry", {
                                country: name || t("unknownCountry"),
                              }),
                        )
                      }
                      onMouseLeave={() => setTooltip(null)}
                      style={{
                        default: {
                          fill: isSelected
                            ? countryColors[countryCode]
                            : isAvailable
                              ? "#d8d3ca"
                              : "#f2e5d8",
                          stroke: "#ffffff",
                          strokeWidth: isLoading ? 1.4 : 0.6,
                          opacity: isLoading ? 0.65 : 1,
                          outline: "none",
                        },
                        hover: {
                          fill: isSelected
                            ? countryColors[countryCode]
                            : isAvailable
                              ? "#c7d2e2"
                              : "#ebd0bf",
                          stroke: "#ffffff",
                          strokeWidth: 0.8,
                          outline: "none",
                          cursor: isAvailable ? "pointer" : "not-allowed",
                        },
                        pressed: {
                          fill: isSelected
                            ? countryColors[countryCode]
                            : "#94a3b8",
                          outline: "none",
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="rounded-full bg-slate-950 px-3 py-1 font-medium text-white">
          {t("selectedCount", {count: selectedCountries.length})}
        </span>
        <span>{tooltip ?? t("hint")}</span>
      </div>
    </section>
  );
}
