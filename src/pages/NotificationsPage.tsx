import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, CheckCheck, Gift, Wallet, ShieldCheck, Info } from "lucide-react";
import { notificationService, type Notification } from "@/services/miscService";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectionError from "@/components/shared/ConnectionError";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/shared/PullToRefreshIndicator";

const typeIcons: Record<string, typeof Bell> = {
  trade: Gift,
  wallet: Wallet,
  security: ShieldCheck,
  info: Info,
};

const typeColors: Record<string, string> = {
  trade: "bg-primary/10 text-primary",
  wallet: "bg-blue-500/10 text-blue-400",
  security: "bg-orange-500/10 text-orange-400",
  info: "bg-muted text-muted-foreground",
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: fetchNotifications });

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background safe-bottom">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-xs text-primary font-medium"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {error && <ConnectionError message={error} onRetry={() => window.location.reload()} />}

      <div className="px-5 space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : notifications.length > 0 ? (
          notifications.map((notif, i) => {
            const IconComp = typeIcons[notif.type] || Bell;
            const colorClass = typeColors[notif.type] || typeColors.info;

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-4 rounded-xl border transition-colors ${
                  notif.is_read
                    ? "bg-card border-border/30"
                    : "bg-primary/[0.03] border-primary/10"
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <IconComp size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold truncate ${notif.is_read ? "text-foreground" : "text-foreground"}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">{formatTime(notif.created_at)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BellOff size={40} className="text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
