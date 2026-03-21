import {useAppStore} from "@/stores/appStore";
import type {ColorMode, PlotlyCamera, SharedViewPayload} from "@/lib/types";

export const SHARE_BASE_URL = "https://constitutionalmap.ai";

export function serializeAtlasState(
  camera: PlotlyCamera | null,
): Omit<SharedViewPayload, "title" | "observation" | "author_name"> {
  const state = useAppStore.getState();
  return {
    countries: state.selectedCountries.length > 0 ? [...state.selectedCountries] : null,
    query_text: state.lastSearchQuery || null,
    query_semantic: state.lastSemanticSearchQuery || null,
    filter_country: state.focusedCountryCode || null,
    filter_cluster: null,
    focused_segment_id: state.focusedSegmentId || null,
    camera,
    color_mode: state.colorMode,
  };
}

export function deserializeSharedView(payload: SharedViewPayload): void {
  const store = useAppStore.getState();
  if (payload.countries?.length) {
    store.addCountries(payload.countries);
  }
  if (payload.query_text) {
    store.setLastSearchQuery(payload.query_text);
  }
  if (payload.query_semantic) {
    store.setLastSemanticSearchQuery(payload.query_semantic);
  }
  if (payload.camera) {
    store.setCameraState(payload.camera);
  }
  if (payload.color_mode) {
    store.setColorMode(payload.color_mode as ColorMode);
  }
  if (payload.filter_country) {
    store.setFocusedCountryCode(payload.filter_country);
  }
  if (payload.focused_segment_id) {
    store.setPendingSegmentId(payload.focused_segment_id);
  }
}
