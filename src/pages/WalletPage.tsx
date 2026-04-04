import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ArrowUpRight, Plus, Building2, Trash2, Download } from "lucide-react";
import { walletService, type WalletBalance, type Transaction, type BankAccount } from "@/services/walletService";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectionError from "@/components/shared/ConnectionError";
import EmptyState from "@/components/shared/EmptyState";
import { Receipt } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/shared/PullToRefreshIndicator";

const WalletPage = () => {
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [tab, setTab] = useState<"history" | "banks">("history");

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [balRes, txRes, bankRes] = await Promise.allSettled([
        walletService.getBalance(),
        walletService.getTransactions(),
        walletService.getBanks(),
      ]);
      if (balRes.status === "fulfilled") setBalance(balRes.value.data);
      if (txRes.status === "fulfilled") setTransactions(txRes.value.data.transactions);
      if (bankRes.status === "fulfilled") setBanks(bankRes.value.data);
    } catch (err: any) {
      setError(err.message || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({ onRefresh: fetchData });

  const handleDeleteBank = async (id: string) => {
    try {
      await walletService.deleteBank(id);
      setBanks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert("Failed to delete bank account");
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background safe-bottom">
      <PullToRefreshIndicator pullDistance={pullDistance} refreshing={refreshing} />
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Wallet</h1>
      </div>

      {/* Balance Card */}
      <div className="px-5 mb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-primary/10 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Available Balance</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-muted-foreground">{showBalance ? <Eye size={16} /> : <EyeOff size={16} />}</button>
          </div>
          <h2 className="text-3xl font-extrabold text-foreground mb-5">
            {loading ? (
              <Skeleton className="h-9 w-40" />
            ) : balance ? (
              showBalance ? `₦${balance.balance.toLocaleString()}` : "₦•••••••"
            ) : (
              showBalance ? "₦0" : "₦•••••••"
            )}
          </h2>
          <button className="h-11 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
            Withdraw <ArrowUpRight size={14} />
          </button>
        </motion.div>
      </div>

      {error && <ConnectionError message={error} onRetry={() => window.location.reload()} />}

      {/* Tabs */}
      <div className="px-5 mb-4">
        <div className="flex gap-1 p-1 rounded-xl bg-secondary">
          {(["history", "banks"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 h-9 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {t === "history" ? "History" : "Bank Accounts"}
            </button>
          ))}
        </div>
      </div>

      {tab === "history" && (
        <div className="px-5 space-y-2.5">
          <button className="flex items-center gap-1.5 text-xs text-primary font-medium mb-2">
            <Download size={12} /> Download Statement
          </button>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : transactions.length > 0 ? (
            transactions.map((tx, i) => (
              <motion.div key={tx.id} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-3.5 rounded-xl bg-card border border-border/30">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-sm font-bold ${tx.type === "credit" ? "text-primary" : "text-destructive"}`}>
                  {tx.type === "credit" ? "+" : "-"}₦{tx.amount.toLocaleString()}
                </span>
              </motion.div>
            ))
          ) : (
            <EmptyState icon={Receipt} title="No transactions yet" description="Your transaction history will appear here once you start trading." />
          )}
        </div>
      )}

      {tab === "banks" && (
        <div className="px-5 space-y-3">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))
          ) : banks.length > 0 ? (
            banks.map((bank) => (
              <div key={bank.id} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 size={16} className="text-primary" /></div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{bank.bank_name}</p>
                    <p className="text-xs text-muted-foreground">{bank.account_number} • {bank.account_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bank.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">Default</span>}
                  <button onClick={() => handleDeleteBank(bank.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          ) : null}
          <button className="w-full h-12 rounded-xl border border-dashed border-border text-sm font-semibold text-muted-foreground flex items-center justify-center gap-1.5 hover:border-primary/30 hover:text-primary transition-colors">
            <Plus size={16} /> Add Bank Account
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
