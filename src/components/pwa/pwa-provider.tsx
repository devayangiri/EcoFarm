"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<boolean>;
  dismissInstall: () => void;
  isDismissed: boolean;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  isIOS: false,
  promptInstall: async () => false,
  dismissInstall: () => {},
  isDismissed: false,
});

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");

      setIsInstalled(isStandalone);

      // Check iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(isAppleDevice && !isStandalone);

      // Check session dismissal
      const dismissed = sessionStorage.getItem("ecofarm_pwa_dismissed");
      if (dismissed === "true") {
        setIsDismissed(true);
      }

      // 2. Register Service Worker in production/supporting browsers
      if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] ServiceWorker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] ServiceWorker registration failed:", err);
          });
      }

      // 3. Capture beforeinstallprompt event (Android / Chromium)
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      // 4. Listen for app installed event
      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        console.log("[PWA] App successfully installed on user device");
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error("[PWA] Install prompt error:", err);
    }
    return false;
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ecofarm_pwa_dismissed", "true");
    }
  }, []);

  const isInstallable = Boolean(deferredPrompt) || isIOS;

  return (
    <PwaContext.Provider
      value={{
        isInstallable: isInstallable && !isInstalled && !isDismissed,
        isInstalled,
        isIOS,
        promptInstall,
        dismissInstall,
        isDismissed,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  return useContext(PwaContext);
}
