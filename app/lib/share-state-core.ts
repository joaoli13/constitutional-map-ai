import type {ColorMode, PlotlyCamera, SharedViewPayload} from "./types.ts";

export type ShareStateSnapshot = {
  selectedCountries: string[];
  lastSearchQuery: string;
  lastSemanticSearchQuery: string;
  focusedCountryCode: string | null;
  focusedSegmentId: string | null;
  selectedPoint: {
    id: string;
    country_code: string;
  } | null;
  colorMode: ColorMode;
};

export type SharedViewRestoreActions = {
  addCountries: (countryCodes: string[]) => void;
  setRestrictSearchToSelectedCountries: (value: boolean) => void;
  setLastSearchQuery: (query: string) => void;
  setLastSemanticSearchQuery: (query: string) => void;
  setCameraState: (camera: PlotlyCamera | null) => void;
  setColorMode: (mode: ColorMode) => void;
  setFocusedCountryCode: (code: string | null) => void;
  setFocusedSegmentId: (id: string | null) => void;
  setPendingSegmentId: (id: string | null) => void;
};

export function buildSharedViewState(
  state: ShareStateSnapshot,
  camera: PlotlyCamera | null,
): Omit<SharedViewPayload, "title" | "observation" | "author_name"> {
  const focusedSegmentId = state.focusedSegmentId || state.selectedPoint?.id || null;
  const focusedCountryCode =
    state.focusedCountryCode || state.selectedPoint?.country_code || null;

  return {
    countries: state.selectedCountries.length > 0 ? [...state.selectedCountries] : null,
    query_text: state.lastSearchQuery || null,
    query_semantic: state.lastSemanticSearchQuery || null,
    filter_country: focusedCountryCode,
    filter_cluster: null,
    focused_segment_id: focusedSegmentId,
    camera,
    color_mode: state.colorMode,
  };
}

export function restoreSharedViewState(
  payload: SharedViewPayload,
  actions: SharedViewRestoreActions,
): void {
  if (payload.countries?.length) {
    actions.addCountries(payload.countries);
    actions.setRestrictSearchToSelectedCountries(true);
  }
  if (payload.query_text) {
    actions.setLastSearchQuery(payload.query_text);
  }
  if (payload.query_semantic) {
    actions.setLastSemanticSearchQuery(payload.query_semantic);
  }
  if (payload.camera) {
    actions.setCameraState(payload.camera);
  }
  if (payload.color_mode) {
    actions.setColorMode(payload.color_mode as ColorMode);
  }
  if (payload.filter_country) {
    actions.setFocusedCountryCode(payload.filter_country);
  }
  if (payload.focused_segment_id) {
    actions.setFocusedSegmentId(payload.focused_segment_id);
    actions.setPendingSegmentId(payload.focused_segment_id);
  }
}
