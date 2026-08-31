"use client";

import { useEffect, useState } from "react";
import {
  dismissForSession,
  isIosDevice,
  isSessionDismissed,
  isStandaloneDisplay,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

export function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() || isSessionDismissed()) return;

    setIos(isIosDevice());
    setVisible(true);
    document.documentElement.dataset.installBanner = "visible";

    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      delete document.documentElement.dataset.installBanner;
    };
  }, []);

  function hideBanner() {
    dismissForSession();
    setVisible(false);
    delete document.documentElement.dataset.installBanner;
  }

  async function handleInstall() {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setVisible(false);
          delete document.documentElement.dataset.installBanner;
          return;
        }
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
      return;
    }

    if (ios) {
      hideBanner();
    }
  }

  if (!visible) return null;

  const iosHint = ios && !deferredPrompt;

  return (
    <aside
      className="fixed right-0 left-0 z-40 mx-auto max-w-md px-3"
      style={{ bottom: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))" }}
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-desc"
    >
      <div
        className="overflow-hidden rounded-md border border-border-hairline bg-surface-raised shadow-[0_-8px_32px_rgba(0,0,0,0.35)]"
        style={{ borderLeft: "3px solid var(--accent-gold)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 100% 0%, var(--accent-gold), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative p-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
              style={{ background: "color-mix(in srgb, var(--accent-gold) 18%, transparent)" }}
              aria-hidden
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.75">
                <path d="M12 3 4 7v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V7l-8-4Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p id="pwa-install-title" className="text-sm font-semibold leading-snug">
                  Install for private, on-device gold tracking
                </p>
                <button
                  type="button"
                  onClick={hideBanner}
                  className="min-h-[32px] min-w-[32px] shrink-0 rounded-sm text-sm leading-none"
                  style={{ color: "var(--ink-secondary)" }}
                  aria-label="Dismiss install suggestion for now"
                >
                  ×
                </button>
              </div>

              <p id="pwa-install-desc" className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
                The installed app is the best way to save your gold details securely — everything stays on
                this device and is not sent to any server.
              </p>

              {iosHint && (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--verify-amber)" }}>
                  Tap Share, then &ldquo;Add to Home Screen&rdquo; to install.
                </p>
              )}

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleInstall}
                  disabled={installing}
                  className="min-h-[40px] flex-1 rounded-sm px-3 text-sm font-medium disabled:opacity-60"
                  style={{ background: "var(--accent-gold)", color: "var(--surface-base)" }}
                >
                  {installing ? "Installing…" : deferredPrompt ? "Install app" : iosHint ? "Got it" : "Install app"}
                </button>
                <button
                  type="button"
                  onClick={hideBanner}
                  className="min-h-[40px] rounded-sm border border-border-hairline px-3 text-sm"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
