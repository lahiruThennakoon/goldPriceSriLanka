"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AppSplash } from "@/components/app-splash";

const SPLASH_SEEN_KEY = "goldpwa.splash.seen";
const MIN_SPLASH_MS = 1400;
const FADE_MS = 500;

type SplashPhase = "splash" | "fade" | "done";

export function SplashGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<SplashPhase>("splash");

  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_SEEN_KEY) === "1") {
      setPhase("done");
      return;
    }

    document.body.style.overflow = "hidden";
    const minTimer = window.setTimeout(() => setPhase("fade"), MIN_SPLASH_MS);

    return () => {
      window.clearTimeout(minTimer);
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (phase !== "fade") return;

    const fadeTimer = window.setTimeout(() => {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
      document.body.style.overflow = "";
      setPhase("done");
    }, FADE_MS);

    return () => window.clearTimeout(fadeTimer);
  }, [phase]);

  return (
    <>
      {children}
      {phase !== "done" && <AppSplash fading={phase === "fade"} />}
    </>
  );
}
