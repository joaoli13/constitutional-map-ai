"use client";

import {useState, useSyncExternalStore} from "react";
import {usePathname} from "next/navigation";
import {useTranslations} from "next-intl";

import LanguageSelector from "@/components/LanguageSelector";
import WelcomeOnboardingModal from "@/components/WelcomeOnboardingModal";
import {routing} from "@/i18n/routing";
import {
  dismissWelcomeOnboarding,
  isWelcomeOnboardingDismissed,
  isWelcomeOnboardingHomePath,
} from "@/lib/welcome-onboarding";

const WELCOME_ONBOARDING_CHANGE_EVENT = "tca-welcome-onboarding-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(
    WELCOME_ONBOARDING_CHANGE_EVENT,
    callback as EventListener,
  );

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(
      WELCOME_ONBOARDING_CHANGE_EVENT,
      callback as EventListener,
    );
  };
}

function getDismissedSnapshot() {
  return isWelcomeOnboardingDismissed(window.localStorage);
}

export default function HeaderControls() {
  const pathname = usePathname();
  const t = useTranslations("WelcomeOnboarding");
  const [isManuallyOpen, setIsManuallyOpen] = useState(false);
  const dismissed = useSyncExternalStore(
    subscribe,
    getDismissedSnapshot,
    () => true,
  );
  const isHomeRoute = isWelcomeOnboardingHomePath(pathname, routing.locales);
  const isOpen = isHomeRoute && (isManuallyOpen || !dismissed);

  function handleDismiss() {
    dismissWelcomeOnboarding(window.localStorage);
    window.dispatchEvent(new Event(WELCOME_ONBOARDING_CHANGE_EVENT));
    setIsManuallyOpen(false);
  }

  return (
    <>
      <div className="flex flex-col items-end gap-3 sm:flex-row sm:items-center">
        {isHomeRoute ? (
          <button
            type="button"
            onClick={() => setIsManuallyOpen(true)}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-500 hover:text-slate-950"
            aria-label={t("modalLabel")}
          >
            {t("buttonLabel")}
          </button>
        ) : null}
        <LanguageSelector />
      </div>
      <WelcomeOnboardingModal isOpen={isOpen} onDismiss={handleDismiss} />
    </>
  );
}
