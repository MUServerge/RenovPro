"use client";

import { useEffect, useState } from "react";
import {
  savePushSubscription,
  removePushSubscription,
  sendTestPush,
} from "@/lib/actions";
import type { Dict } from "@/lib/i18n/dictionaries";

type State =
  | "loading"
  | "off"
  | "on"
  | "denied"
  | "ios"
  | "unsupported";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const DISMISS_KEY = "maysterpro-push-banner-dismissed";

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isIosBrowserTab(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document);
  const standalone =
    (navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches;
  return ios && !standalone;
}

/**
 * Daily-reminder switch.
 * variant "card"   — full control (profile page).
 * variant "banner" — small prompt on the dashboard, shown only while reminders
 *                    are off; can be dismissed.
 */
export default function PushToggle({
  t,
  variant = "card",
}: {
  t: Dict;
  variant?: "card" | "banner";
}) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    (async () => {
      if (!VAPID) return setState("unsupported");
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;
      if (!supported) return setState(isIosBrowserTab() ? "ios" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          // Keep the server copy in sync (e.g. after a database reset).
          await savePushSubscription(sub.toJSON() as never);
          setState("on");
        } else {
          setState("off");
        }
      } catch {
        setState("off");
      }
    })();
  }, []);

  async function enable() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToBytes(VAPID),
        }));
      const res = await savePushSubscription(sub.toJSON() as never);
      setState(res.ok ? "on" : "off");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg("");
    try {
      const { sent } = await sendTestPush();
      if (sent === 0) setMsg(t.pushNoDevice);
    } finally {
      setBusy(false);
    }
  }

  // Reminders not set up on the server yet (no VAPID key) — show nothing.
  if (!VAPID) return null;

  if (variant === "banner") {
    if (dismissed || state !== "off") return null;
    return (
      <div className="px-3 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-brand-med/30 bg-brand-light px-3 py-2.5">
          <span className="text-lg">🔔</span>
          <div className="min-w-0 flex-1 text-xs font-semibold text-brand-dark">
            {t.pushDesc}
          </div>
          <button
            type="button"
            onClick={enable}
            disabled={busy}
            className="whitespace-nowrap rounded-lg bg-brand-dark px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {t.pushEnable}
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(true);
              try {
                localStorage.setItem(DISMISS_KEY, "1");
              } catch {}
            }}
            className="px-1 text-brand-muted"
            aria-label="close"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand-line bg-white p-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔔</span>
        <div className="text-sm font-bold text-brand-dark">{t.pushTitle}</div>
      </div>
      <p className="mt-1 text-xs text-brand-muted">{t.pushDesc}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {state === "loading" && <span className="text-xs text-brand-muted">…</span>}
        {state === "off" && (
          <button type="button" onClick={enable} disabled={busy} className={btnMain}>
            {t.pushEnable}
          </button>
        )}
        {state === "on" && (
          <>
            <span className="text-sm font-bold text-[#2e8b57]">✓ {t.pushEnabled}</span>
            <button type="button" onClick={test} disabled={busy} className={btnSoft}>
              {t.pushTest}
            </button>
            <button type="button" onClick={disable} disabled={busy} className={btnSoft}>
              {t.pushDisable}
            </button>
          </>
        )}
        {state === "denied" && <Note>{t.pushBlocked}</Note>}
        {state === "ios" && <Note>{t.pushIosHint}</Note>}
        {state === "unsupported" && <Note>{t.pushUnsupported}</Note>}
      </div>
      {msg && <div className="mt-2 text-xs text-brand-danger">{msg}</div>}
    </div>
  );
}

const btnMain =
  "rounded-lg bg-brand-dark px-3 py-2 text-sm font-bold text-white disabled:opacity-50";
const btnSoft =
  "rounded-lg bg-brand-light px-3 py-2 text-sm font-bold text-brand-dark disabled:opacity-50";

function Note({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-brand-danger">{children}</div>;
}
