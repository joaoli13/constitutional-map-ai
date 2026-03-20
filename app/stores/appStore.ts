"use client";

import {create} from "zustand";

import type {
  AtlasSelectionPoint,
  ColorMode,
  CountryPoint,
  SemanticSearchResult,
  SearchResult,
} from "@/lib/types";

type CountryDataCache = Record<string, CountryPoint[]>;

type AppState = {
  selectedCountries: string[];
  loadedCountryData: CountryDataCache;
  selectedPoint: AtlasSelectionPoint | null;
  searchResults: SearchResult[];
  semanticSearchResults: SemanticSearchResult[];
  lastSearchQuery: string;
  lastSemanticSearchQuery: string;
  restrictSearchToSelectedCountries: boolean;
  colorMode: ColorMode;
  toggleCountrySelection: (countryCode: string) => void;
  addCountries: (countryCodes: string[]) => void;
  removeCountrySelection: (countryCode: string) => void;
  clearCountrySelection: () => void;
  setCountryData: (countryCode: string, points: CountryPoint[]) => void;
  setSelectedPoint: (point: AtlasSelectionPoint | null) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSemanticSearchResults: (results: SemanticSearchResult[]) => void;
  setLastSearchQuery: (query: string) => void;
  setLastSemanticSearchQuery: (query: string) => void;
  setRestrictSearchToSelectedCountries: (value: boolean) => void;
  setColorMode: (mode: ColorMode) => void;
};

export const useAppStore = create<AppState>((set) => ({
  selectedCountries: [],
  loadedCountryData: {},
  selectedPoint: null,
  searchResults: [],
  semanticSearchResults: [],
  lastSearchQuery: "",
  lastSemanticSearchQuery: "",
  restrictSearchToSelectedCountries: false,
  colorMode: "country",
  toggleCountrySelection: (countryCode) =>
    set((state) => {
      const alreadySelected = state.selectedCountries.includes(countryCode);
      const nextSelectedCountries = alreadySelected
        ? state.selectedCountries.filter((code) => code !== countryCode)
        : [...state.selectedCountries, countryCode];
      return {
        selectedCountries: nextSelectedCountries,
        selectedPoint:
          state.selectedPoint
          && !nextSelectedCountries.includes(state.selectedPoint.country_code)
            ? null
            : state.selectedPoint,
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
      selectedPoint:
        state.selectedPoint?.country_code === countryCode ? null : state.selectedPoint,
    })),
  clearCountrySelection: () => set({selectedCountries: [], selectedPoint: null}),
  setCountryData: (countryCode, points) =>
    set((state) => ({
      loadedCountryData: {
        ...state.loadedCountryData,
        [countryCode]: points,
      },
    })),
  setSelectedPoint: (point) => set({selectedPoint: point}),
  setSearchResults: (results) => set({searchResults: results}),
  setSemanticSearchResults: (results) => set({semanticSearchResults: results}),
  setLastSearchQuery: (query) => set({lastSearchQuery: query}),
  setLastSemanticSearchQuery: (query) => set({lastSemanticSearchQuery: query}),
  setRestrictSearchToSelectedCountries: (value) =>
    set({restrictSearchToSelectedCountries: value}),
  setColorMode: (mode) => set({colorMode: mode}),
}));
