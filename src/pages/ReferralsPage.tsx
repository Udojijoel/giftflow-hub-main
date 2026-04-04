import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Share2, Users, DollarSign, Gift } from "lucide-react";
import { referralService, type ReferralStats, type Referral } from "@/services/miscService";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";

const ReferralsPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, historyRes] = await Promise.allSettled([
          referralService.getStats(),
          referralService.getHistory(),
        ]);
        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (historyRes.status === "fulfilled") setReferrals(historyRes.value.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = () => {
    if (stats?.referral_code) {
      navigator.clipboard.writeText(stats.referral_link || stats.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Join CardFlip and earn money selling gift cards! Use my referral code: ${stats?.referral_code || ""} ${stats?.referral_link || ""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Refer & Earn</h1>
      </div>

      <div className="px-5">
        {/* Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/10 p-5 text-center mb-6">
          <Gift size={32} className="text-primary mx-auto mb-2" />
          <h2 className="text-lg font-bold text-foreground mb-1">Earn ₦500 per referral</h2>
          <p className="text-sm text-muted-foreground">Share your code and earn when your friends complete their first trade</p>
        </motion.div>

        {/* Referral Code */}
        <div className="rounded-xl bg-card border border-border/30 p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-2">Your referral code</p>
          {loading ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-lg font-bold font-mono text-primary">{stats?.referral_code || "—"}</span>
              <button onClick={handleCopy} className="h-9 px-4 rounded-lg bg-primary/15 text-primary text-sm font-semibold flex items-center gap-1.5">
                <Copy size={14} /> {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
        </div>

        <button onClick={handleWhatsAppShare} className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 mb-6">
          <Share2 size={16} /> Share via WhatsApp
        </button>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-card border border-border/30 p-4 text-center">
            <Users size={18} className="text-primary mx-auto mb-1" />
            {loading ? <Skeleton className="h-8 w-12 mx-auto" /> : <p className="text-2xl font-extrabold text-foreground">{stats?.total_referrals || 0}</p>}
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </div>
          <div className="rounded-xl bg-card border border-border/30 p-4 text-center">
            <DollarSign size={18} className="text-primary mx-auto mb-1" />
            {loading ? <Skeleton className="h-8 w-16 mx-auto" /> : <p className="text-2xl font-extrabold text-foreground">₦{(stats?.total_earned || 0).toLocaleString()}</p>}
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
        </div>

        {/* History */}
        <h3 className="text-sm font-semibold text-foreground mb-3">Referral History</h3>
        <div className="space-y-2.5">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))
          ) : referrals.length > 0 ? (
            referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/30">
                <div>
                  <p className="text-sm font-semibold text-foreground">{r.referred_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">₦{r.bonus_amount.toLocaleString()}</p>
                  <span className={`text-[10px] font-semibold ${r.is_paid ? "text-primary" : "text-muted-foreground"}`}>
                    {r.is_paid ? "Credited" : "Pending"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState icon={Users} title="No referrals yet" description="Share your referral code with friends to start earning!" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferralsPage;
