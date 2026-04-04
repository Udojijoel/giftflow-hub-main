import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminTrade {
  id: string;
  user: string;
  card: string;
  type: string;
  denomination: string;
  quantity: number;
  amount: string;
  status: string;
  date: string;
  imageUrl: string;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Pending: "outline",
  Processing: "secondary",
  Approved: "default",
  Paid: "default",
  Rejected: "destructive",
};

const AdminTrades = () => {
  const [trades, setTrades] = useState<AdminTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selectedTrade, setSelectedTrade] = useState<AdminTrade | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const status = filter === "All" ? undefined : filter;
      const res = await adminService.getAllTrades(1, status);
      setTrades(res.data.trades || res.data || []);
    } catch {
      setTrades([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrades(); }, [filter]);

  const filtered = trades.filter((t) => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.user.toLowerCase().includes(search.toLowerCase()) ||
      t.card.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleApprove = async (trade: AdminTrade) => {
    setActionLoading(true);
    try {
      await adminService.approveTrade(trade.id, adminNote);
      setSelectedTrade(null);
      fetchTrades();
    } catch { alert("Failed to approve trade"); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (trade: AdminTrade) => {
    setActionLoading(true);
    try {
      await adminService.rejectTrade(trade.id, adminNote);
      setSelectedTrade(null);
      fetchTrades();
    } catch { alert("Failed to reject trade"); }
    finally { setActionLoading(false); }
  };

  const filters = ["All", "Pending", "Processing", "Approved", "Paid", "Rejected"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Trade Management</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by ID, user, or card..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "secondary"} onClick={() => setFilter(f)} className="whitespace-nowrap text-xs">{f}</Button>
          ))}
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Trade ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Card</TableHead>
                <TableHead className="hidden md:table-cell">Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((t) => (
                  <TableRow key={t.id} className="border-border">
                    <TableCell className="font-mono text-xs">{t.id}</TableCell>
                    <TableCell className="text-sm">{t.user}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{t.card} {t.denomination}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.type}</TableCell>
                    <TableCell className="font-semibold text-sm">{t.amount}</TableCell>
                    <TableCell><Badge variant={statusVariant[t.status] || "secondary"}>{t.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedTrade(t); setAdminNote(""); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {t.status === "Pending" && (
                          <>
                            <Button size="icon" variant="ghost" className="text-primary hover:text-primary" onClick={() => handleApprove(t)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleReject(t)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No trades found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Trade {selectedTrade?.id}</DialogTitle></DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">User:</span> <span className="text-foreground font-medium">{selectedTrade.user}</span></div>
                <div><span className="text-muted-foreground">Card:</span> <span className="text-foreground font-medium">{selectedTrade.card}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground font-medium">{selectedTrade.type}</span></div>
                <div><span className="text-muted-foreground">Denomination:</span> <span className="text-foreground font-medium">{selectedTrade.denomination}</span></div>
                <div><span className="text-muted-foreground">Quantity:</span> <span className="text-foreground font-medium">{selectedTrade.quantity}</span></div>
                <div><span className="text-muted-foreground">Amount:</span> <span className="text-foreground font-medium">{selectedTrade.amount}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusVariant[selectedTrade.status] || "secondary"} className="ml-1">{selectedTrade.status}</Badge></div>
                <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground font-medium">{selectedTrade.date}</span></div>
              </div>
              {selectedTrade.imageUrl && (
                <img src={selectedTrade.imageUrl} alt="Card" className="rounded-lg w-full max-h-40 object-contain bg-secondary/50" />
              )}
              {!selectedTrade.imageUrl && (
                <div className="rounded-lg bg-secondary/50 h-40 flex items-center justify-center text-muted-foreground text-sm">No card image</div>
              )}
              {selectedTrade.status === "Pending" && (
                <>
                  <Textarea placeholder="Admin note (optional)..." value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="bg-background border-border" />
                  <DialogFooter className="gap-2">
                    <Button variant="destructive" onClick={() => handleReject(selectedTrade)} disabled={actionLoading}>Reject</Button>
                    <Button onClick={() => handleApprove(selectedTrade)} disabled={actionLoading}>Approve</Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTrades;
