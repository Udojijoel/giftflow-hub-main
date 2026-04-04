import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Clock } from "lucide-react";

const TradeSubmitted = () => {
  const navigate = useNavigate();
  const tradeId = "TRD-" + Math.random().toString(36).substring(2, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
      >
        <CheckCircle2 size={40} className="text-primary" />
      </motion.div>

      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-2xl font-bold text-foreground mb-2">
        Trade Submitted!
      </motion.h1>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-muted-foreground text-center text-sm mb-6">
        Your trade is being processed. You'll be notified once it's approved.
      </motion.p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="rounded-2xl bg-card border border-border/30 p-5 w-full max-w-sm space-y-3 mb-8">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Trade ID</span>
          <button className="flex items-center gap-1 text-primary font-mono font-semibold text-sm">
            {tradeId} <Copy size={12} />
          </button>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated Time</span>
          <span className="flex items-center gap-1 text-foreground font-semibold"><Clock size={12} /> 5-15 minutes</span>
        </div>
      </motion.div>

      <div className="w-full max-w-sm space-y-3">
        <button onClick={() => navigate("/trades")} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold">
          Track Trade
        </button>
        <button onClick={() => navigate("/dashboard")} className="w-full h-14 rounded-2xl bg-secondary text-secondary-foreground font-semibold">
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default TradeSubmitted;
