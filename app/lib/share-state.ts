import {useAppStore} from "@/stores/appStore";
import type {PlotlyCamera, SharedViewPayload} from "@/lib/types";
import {buildSharedViewState, restoreSharedViewState} from "@/lib/share-state-core";

export const SHARE_BASE_URL = "https://constitutionalmap.ai";

export function serializeAtlasState(
  camera: PlotlyCamera | null,
): Omit<SharedViewPayload, "title" | "observation" | "author_name"> {
  const state = useAppStore.getState();
  return buildSharedViewState(state, camera);
}

export function deserializeSharedView(payload: SharedViewPayload): void {
  const store = useAppStore.getState();
  restoreSharedViewState(payload, store);
}
