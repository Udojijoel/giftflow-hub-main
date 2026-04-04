import { useState } from "react";
import { Download, X, Share } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { motion, AnimatePresence } from "framer-motion";

const InstallPrompt = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWA();
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem("pwa_prompt_dismissed") === "true";
  });

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const handleInstall = async () => {
    const accepted = await install();
    if (accepted) handleDismiss();
  };

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-lg max-w-md mx-auto"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground text-sm">Install CardFlip</h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1">
                Tap <Share size={12} className="inline" /> then{" "}
                <span className="font-semibold text-foreground">"Add to Home Screen"</span>
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-1">
                  Add to your home screen for the best experience
                </p>
                <button
                  onClick={handleInstall}
                  className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Install App
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallPrompt;
