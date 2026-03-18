"use client";

import {create} from "zustand";

import type {
  AtlasSelectionPoint,
  ColorMode,
  CountryPoint,
  SearchResult,
} from "@/lib/types";

type CountryDataCache = Record<string, CountryPoint[]>;

type AppState = {
  selectedCountries: string[];
  loadedCountryData: CountryDataCache;
  selectedPoint: AtlasSelectionPoint | null;
  searchResults: SearchResult[];
  colorMode: ColorMode;
  toggleCountrySelection: (countryCode: string) => void;
  addCountries: (countryCodes: string[]) => void;
  removeCountrySelection: (countryCode: string) => void;
  clearCountrySelection: () => void;
  setCountryData: (countryCode: string, points: CountryPoint[]) => void;
  setSelectedPoint: (point: AtlasSelectionPoint | null) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setColorMode: (mode: ColorMode) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedCountries: [],
  loadedCountryData: {},
  selectedPoint: null,
  searchResults: [],
  colorMode: "country",
  toggleCountrySelection: (countryCode) =>
    set((state) => {
      const alreadySelected = state.selectedCountries.includes(countryCode);
      return {
        selectedCountries: alreadySelected
          ? state.selectedCountries.filter((code) => code !== countryCode)
          : [...state.selectedCountries, countryCode],
      };
    }),
  addCountries: (countryCodes) =>
    set((state) => ({
      selectedCountries: [...new Set([...state.selectedCountries, ...countryCodes])],
    })),
  removeCountrySelection: (countryCode) =>
    set((state) => ({
      selectedCountries: state.selectedCountries.filter(
        (code) => code !== countryCode,
      ),
    })),
  clearCountrySelection: () => set({selectedCountries: []}),
  setCountryData: (countryCode, points) =>
    set((state) => ({
      loadedCountryData: {
        ...state.loadedCountryData,
        [countryCode]: points,
      },
    })),
  setSelectedPoint: (point) => set({selectedPoint: point}),
  setSearchResults: (results) => set({searchResults: results}),
  setColorMode: (mode) => set({colorMode: mode}),
}));
