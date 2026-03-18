"use client";

import {useEffect, useRef, useState} from "react";

import {useAppStore} from "@/stores/appStore";

export function useCountryData(selectedCountries: string[]) {
  const loadedCountryData = useAppStore((state) => state.loadedCountryData);
  const setCountryData = useAppStore((state) => state.setCountryData);
  const inFlight = useRef(new Set<string>());
  const [loadingCountries, setLoadingCountries] = useState<string[]>([]);
  const [errorCountry, setErrorCountry] = useState<string | null>(null);

  // Keep a ref so the effect can read the latest cache without being re-triggered
  // every time a country finishes loading (which was causing a cascade of
  // cleanup → cancelled = true → all concurrent fetches aborted).
  const loadedRef = useRef(loadedCountryData);
  loadedRef.current = loadedCountryData;

  useEffect(() => {
    let cancelled = false;

    async function loadCountry(countryCode: string) {
      inFlight.current.add(countryCode);
      setLoadingCountries((current) => [...new Set([...current, countryCode])]);

      try {
        const response = await fetch(`/data/countries/${countryCode}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load ${countryCode}: ${response.status}`);
        }

        const payload = await response.json();
        if (!cancelled) {
          setCountryData(countryCode, payload);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorCountry(countryCode);
          console.error("Country data load failed", error);
        }
      } finally {
        inFlight.current.delete(countryCode);
        if (!cancelled) {
          setLoadingCountries((current) =>
            current.filter((value) => value !== countryCode),
          );
        }
      }
    }

    for (const countryCode of selectedCountries) {
      // Use the ref so this check doesn't add loadedCountryData to deps.
      if (loadedRef.current[countryCode] ?? inFlight.current.has(countryCode)) {
        continue;
      }

      void loadCountry(countryCode);
    }

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountries, setCountryData]);

  return {loadingCountries, errorCountry};
}
