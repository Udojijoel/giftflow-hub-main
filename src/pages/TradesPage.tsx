import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gift, FileX } from "lucide-react";
import { tradeService, type Trade } from "@/services/tradeService";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectionError from "@/components/shared/ConnectionError";
import EmptyState from "@/components/shared/EmptyState";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/shared/PullToRefreshIndicator";

const statusColors: Record<string, string> = {
  Approved: "bg-primary/20 text-primary",
  Processing: "bg-warning/20 text-warning",
  Paid: "bg-primary/20 text-primary",
  Pending: "bg-muted text-muted-foreground",
  Rejected: "bg-destructive/20 text-destructive",
};

const filters = ["All", "Pending", "Processing", "Approved", "Paid", "Rejected"];

const TradesPage = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("All");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status = activeFilter === "All" ? undefined : activeFilter;
      const res = await tradeService.getAll(1, status);
      setTrades(res.data.trades);
    } catch (err: any) {
      setError(err.message || "Failed to load trades");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: fetchTrades });

  return (
    <div ref={containerRef} className="min-h-screen bg-background safe-bottom">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">My Trades</h1>
      </div>

      <div className="px-5 mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
        {filters.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {error && <ConnectionError message={error} onRetry={() => window.location.reload()} />}

      <div className="px-5 space-y-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : trades.length > 0 ? (
          trades.map((trade, i) => (
            <motion.div key={trade.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl bg-card border border-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Gift size={14} className="text-primary" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{trade.card_brand}</p>
                    <p className="text-xs text-muted-foreground">{trade.card_type} • {trade.denomination}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[trade.status] || ""}`}>{trade.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">{trade.id}</span>
                <span className="text-sm font-bold text-foreground">₦{trade.naira_amount.toLocaleString()}</span>
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyState icon={FileX} title="No trades found" description={activeFilter === "All" ? "You haven't made any trades yet." : `No ${activeFilter.toLowerCase()} trades.`} />
        )}
      </div>
    </div>
  );
};

export default TradesPage;
