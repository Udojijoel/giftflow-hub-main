import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
}

const PullToRefreshIndicator = ({ pullDistance, refreshing, threshold = 80 }: PullToRefreshIndicatorProps) => {
  if (pullDistance === 0 && !refreshing) return null;

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <motion.div
      className="flex items-center justify-center overflow-hidden"
      style={{ height: pullDistance }}
      animate={refreshing ? { height: 48 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <motion.div
        animate={refreshing ? { rotate: 360 } : { rotate: progress * 360 }}
        transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}
      >
        <Loader2
          size={20}
          className={`${progress >= 1 || refreshing ? "text-primary" : "text-muted-foreground/50"}`}
        />
      </motion.div>
    </motion.div>
  );
};

export default PullToRefreshIndicator;
