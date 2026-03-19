"use client";

import {useCallback, useEffect, useRef, useState} from "react";

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const doc = document as FullscreenDocument;

    function updateState() {
      const current = ref.current;
      const activeElement = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsFullscreen(Boolean(current && activeElement === current));
    }

    updateState();
    document.addEventListener("fullscreenchange", updateState);
    document.addEventListener("webkitfullscreenchange", updateState as EventListener);

    return () => {
      document.removeEventListener("fullscreenchange", updateState);
      document.removeEventListener("webkitfullscreenchange", updateState as EventListener);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const current = ref.current as FullscreenElement | null;
    if (!current) {
      return;
    }

    const doc = document as FullscreenDocument;
    const activeElement = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;

    if (activeElement === current) {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else {
        await Promise.resolve(doc.webkitExitFullscreen?.());
      }
      return;
    }

    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else {
        await Promise.resolve(doc.webkitExitFullscreen?.());
      }
    }

    if (current.requestFullscreen) {
      await current.requestFullscreen();
    } else {
      await Promise.resolve(current.webkitRequestFullscreen?.());
    }
  }, []);

  return {ref, isFullscreen, toggleFullscreen};
}
