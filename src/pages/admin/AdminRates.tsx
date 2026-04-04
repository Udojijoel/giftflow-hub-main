import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Search } from "lucide-react";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

interface Rate {
  id: string;
  brand: string;
  type: string;
  denomination: string;
  ratePerDollar: number;
  isActive: boolean;
}

const AdminRates = () => {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Rate | null>(null);
  const [editRate, setEditRate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRates = async () => {
      setLoading(true);
      try {
        const res = await adminService.getRates();
        setRates(res.data || []);
      } catch {
        setRates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRates();
  }, []);

  const filtered = rates.filter(
    (r) =>
      r.brand.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await adminService.updateRate(id, { is_active: !currentActive });
      setRates((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
    } catch {
      alert("Failed to toggle rate");
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminService.updateRate(editing.id, { rate_per_dollar: Number(editRate) });
      setRates((prev) =>
        prev.map((r) => (r.id === editing.id ? { ...r, ratePerDollar: Number(editRate) || r.ratePerDollar } : r))
      );
      setEditing(null);
    } catch {
      alert("Failed to update rate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Rate Management</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search brand or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Denomination</TableHead>
                <TableHead>Rate (₦/$)</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((r) => (
                  <TableRow key={r.id} className="border-border">
                    <TableCell className="font-medium">{r.brand}</TableCell>
                    <TableCell className="text-muted-foreground">{r.type}</TableCell>
                    <TableCell>{r.denomination}</TableCell>
                    <TableCell className="font-semibold text-primary">₦{r.ratePerDollar}</TableCell>
                    <TableCell>
                      <Switch checked={r.isActive} onCheckedChange={() => handleToggle(r.id, r.isActive)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setEditRate(String(r.ratePerDollar)); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No rates found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Edit Rate — {editing?.brand} {editing?.denomination}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rate per Dollar (₦)</Label>
              <Input type="number" value={editRate} onChange={(e) => setEditRate(e.target.value)} className="bg-background border-border" />
            </div>
            <p className="text-sm text-muted-foreground">
              {editing && `Customer selling ${editing.denomination} will receive ₦${(Number(editRate) || 0) * parseInt(editing.denomination.replace("$", ""))}`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Rate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRates;
