import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeftRight,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig: ChartConfig = {
  trades: { label: "Trades", color: "hsl(var(--primary))" },
};

const statusColors: Record<string, string> = {
  Pending: "bg-warning/20 text-warning",
  Processing: "bg-blue-500/20 text-blue-400",
  Approved: "bg-primary/20 text-primary",
  Paid: "bg-primary/20 text-primary",
  Rejected: "bg-destructive/20 text-destructive",
};

interface DashboardStats {
  today_trades: number;
  trade_volume: number;
  pending_count: number;
  total_users: number;
  today_trades_change: string;
  volume_change: string;
  pending_change: string;
  users_change: string;
  weekly_chart: { day: string; trades: number }[];
  recent_trades: { id: string; user: string; card: string; amount: string; status: string }[];
}

const AdminDashboard = () => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await adminService.getDashboardStats();
        setData(res.data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = data
    ? [
        { label: "Today's Trades", value: data.today_trades.toLocaleString(), change: data.today_trades_change, icon: ArrowLeftRight, up: !data.today_trades_change.startsWith("-") },
        { label: "Trade Volume", value: `₦${(data.trade_volume / 1_000_000).toFixed(1)}M`, change: data.volume_change, icon: DollarSign, up: !data.volume_change.startsWith("-") },
        { label: "Pending Trades", value: data.pending_count.toLocaleString(), change: data.pending_change, icon: Clock, up: !data.pending_change.startsWith("-") },
        { label: "Total Users", value: data.total_users.toLocaleString(), change: data.users_change, icon: Users, up: !data.users_change.startsWith("-") },
      ]
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          : stats.map((s) => (
              <Card key={s.label} className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <s.icon className="h-5 w-5 text-muted-foreground" />
                    <span className={`flex items-center text-xs font-medium ${s.up ? "text-primary" : "text-destructive"}`}>
                      {s.up ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                      {s.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Chart */}
        <Card className="lg:col-span-3 border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Weekly Trades</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[240px] w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-[240px] w-full">
                <BarChart data={data?.weekly_chart || []}>
                  <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="trades" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Trades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              : (data?.recent_trades || []).map((t) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.user}</p>
                      <p className="text-xs text-muted-foreground">{t.card}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{t.amount}</p>
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[t.status] || ""}`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
            {!loading && (!data?.recent_trades || data.recent_trades.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent trades</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
