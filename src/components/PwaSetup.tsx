"use client";

import { useEffect, useState } from "react";
import type { Dict } from "@/lib/i18n/dictionaries";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function PwaSetup({ t }: { t: Dict }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  // Register the service worker.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isStandalone()) return; // already installed → never prompt

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    const onInstalled = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS has no beforeinstallprompt — show manual hint.
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) && !isStandalone()) {
      setIos(true);
      setShow(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!show) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setShow(false);
    setDeferred(null);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 no-print">
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-brand-line bg-white p-3 shadow-lg">
        <img src="/icons/icon-192.png" alt="" className="h-11 w-11 rounded-xl" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-brand-txt">{t.installApp}</div>
          {ios && (
            <div className="mt-0.5 text-xs text-brand-muted">{t.installIosHint}</div>
          )}
        </div>
        {!ios && (
          <button
            onClick={install}
            className="shrink-0 rounded-xl bg-brand-dark px-4 py-2 text-sm font-bold text-white"
          >
            {t.install}
          </button>
        )}
        <button
          onClick={() => setShow(false)}
          className="shrink-0 rounded-xl bg-[#eef1f5] px-3 py-2 text-sm font-semibold text-brand-txt"
        >
          {t.installLater}
        </button>
      </div>
    </div>
  );
}
