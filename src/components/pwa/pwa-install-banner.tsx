"use client";

import React, { useState } from "react";
import { usePwa } from "./pwa-provider";
import { Download, X, Share, PlusSquare, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall, dismissInstall } = usePwa();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or not installable on this device/session, render nothing
  if (isInstalled || !isInstallable) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    setIsInstalling(true);
    await promptInstall();
    setIsInstalling(false);
  };

  return (
    <div className="md:hidden mx-3 my-2.5 p-3.5 rounded-xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 via-brand-secondary/5 to-white shadow-sm font-body">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-brand-primary text-white flex items-center justify-center shrink-0 shadow-sm ring-1 ring-brand-primary/30">
            <Smartphone className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h4 className="font-heading font-bold text-sm text-brand-primary leading-snug">
              Install EcoFarm App
            </h4>
            <p className="text-[11px] text-slate-neutral leading-tight mt-0.5">
              Instant loading & full mobile app experience
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={dismissInstall}
          className="text-slate-neutral/60 hover:text-slate-neutral p-1 -mr-1 -mt-1 rounded-md transition-colors"
          aria-label="Dismiss app install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-brand-primary/10 flex items-center justify-between gap-2">
        <span className="text-[10px] text-brand-primary font-semibold uppercase tracking-wider">
          Direct Website Install
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={handleInstallClick}
          isLoading={isInstalling}
          leftIcon={<Download className="h-3.5 w-3.5" />}
          className="text-xs h-8 px-3 font-semibold shadow-sm"
        >
          {isIOS ? "How to Install" : "Install App"}
        </Button>
      </div>

      {/* iOS Step-by-step Modal / Guide */}
      {showIOSGuide && (
        <div className="mt-3 p-3 bg-white rounded-lg border border-surface-dim text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-bold text-on-surface">
            <span>Install on iPhone / iPad:</span>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="text-slate-neutral hover:text-on-surface"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-neutral leading-relaxed">
            <li>
              Tap the <Share className="inline h-3.5 w-3.5 mx-0.5 text-brand-secondary" /> <strong>Share</strong> button at bottom of Safari.
            </li>
            <li>
              Scroll down and select <PlusSquare className="inline h-3.5 w-3.5 mx-0.5 text-brand-primary" /> <strong>Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong>Add</strong> in the top right to complete.
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
