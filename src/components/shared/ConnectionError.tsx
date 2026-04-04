import { motion } from "framer-motion";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConnectionErrorProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Graceful error state shown when the API is unreachable.
 * Displays a friendly message instead of raw error text.
 */
const ConnectionError = ({ message, onRetry }: ConnectionErrorProps) => {
  const isNetworkError =
    !message ||
    message.includes("Network Error") ||
    message.includes("ERR_CONNECTION") ||
    message.includes("Failed to fetch") ||
    message.includes("ECONNREFUSED");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-5 mb-4 p-5 rounded-2xl bg-card border border-border/30 text-center"
    >
      <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <WifiOff size={20} className="text-muted-foreground/50" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">
        {isNetworkError ? "Backend not connected" : "Something went wrong"}
      </p>
      <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
        {isNetworkError
          ? "Set VITE_API_BASE_URL and start your API server to load live data."
          : message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="rounded-xl gap-1.5">
          <RefreshCw size={12} /> Retry
        </Button>
      )}
    </motion.div>
  );
};

export default ConnectionError;
