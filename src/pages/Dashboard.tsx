import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Bell, ArrowUpRight, Clock, Gift, Users, Headphones, TrendingUp, Loader2 } from "lucide-react";
import { walletService, type WalletBalance } from "@/services/walletService";
import { tradeService, type Trade } from "@/services/tradeService";
import { rateService, type CardRate } from "@/services/rateService";
import { notificationService } from "@/services/miscService";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [rates, setRates] = useState<CardRate[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [balanceRes, tradesRes, ratesRes, notifRes] = await Promise.allSettled([
        walletService.getBalance(),
        tradeService.getAll(1),
        rateService.getAll(),
        notificationService.getAll(),
      ]);

      if (balanceRes.status === "fulfilled") setBalance(balanceRes.value.data);
      if (tradesRes.status === "fulfilled") setTrades(tradesRes.value.data.trades.slice(0, 5));
      if (ratesRes.status === "fulfilled") setRates(ratesRes.value.data.slice(0, 10));
      if (notifRes.status === "fulfilled") {
        const unread = notifRes.value.data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: fetchData });

  const quickActions = [
    { icon: Gift, label: "Sell Card", path: "/sell", color: "bg-primary/15 text-primary" },
    { icon: Clock, label: "History", path: "/trades", color: "bg-blue-500/15 text-blue-400" },
    { icon: Users, label: "Refer", path: "/referrals", color: "bg-purple-500/15 text-purple-400" },
    { icon: Headphones, label: "Support", path: "/support", color: "bg-orange-500/15 text-orange-400" },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background safe-bottom">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back 👋</p>
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center relative"
          >
            <Bell size={18} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/10 p-5"
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Wallet Balance</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground">
              {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground mb-4">
            {loading ? (
              <Skeleton className="h-9 w-40" />
            ) : balance ? (
              showBalance ? `₦${balance.balance.toLocaleString()}` : "₦•••••••"
            ) : (
              showBalance ? "₦0" : "₦•••••••"
            )}
          </h2>
          <button
            onClick={() => navigate("/wallet")}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            Withdraw <ArrowUpRight size={14} />
          </button>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2"
            >
              <div className={`w-12 h-12 rounded-2xl ${action.color} flex items-center justify-center`}>
                <action.icon size={20} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Live Rates Ticker */}
      <div className="px-5 mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">Live Rates</h3>
        {loading ? (
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="shrink-0 h-10 w-32 rounded-xl" />
            ))}
          </div>
        ) : rates.length > 0 ? (
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-1">
            {rates.map((rate) => (
              <div key={rate.id} className="shrink-0 px-4 py-2.5 rounded-xl bg-card border border-border/50 flex items-center gap-2.5">
                <span className="text-sm font-semibold text-foreground">{rate.brand_name}</span>
                <span className="text-xs font-bold text-primary">₦{rate.rate_per_dollar}/$</span>
                <TrendingUp size={12} className="text-primary" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No rates available</p>
        )}
      </div>

      {/* Error banner */}
      {error && <ConnectionError message={error} onRetry={() => window.location.reload()} />}

      {/* Recent Transactions */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Trades</h3>
          <button onClick={() => navigate("/trades")} className="text-xs text-primary font-medium">See all</button>
        </div>
        <div className="space-y-2.5">
          {loading ? (
            [1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : trades.length > 0 ? (
            trades.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Gift size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tx.card_brand}</p>
                    <p className="text-xs text-muted-foreground">{tx.denomination}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">₦{tx.naira_amount.toLocaleString()}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[tx.status] || ""}`}>
                    {tx.status}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <EmptyState icon={Gift} title="No trades yet" description="Start by selling a gift card to see your trades here." actionLabel="Sell a Card" onAction={() => navigate("/sell")} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
