import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Search, ShieldOff, Shield } from "lucide-react";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  kycStatus: string;
  trades: number;
  balance: string;
  isFrozen: boolean;
  joined: string;
}

const kycColors: Record<string, string> = {
  Verified: "bg-primary/20 text-primary",
  Pending: "bg-warning/20 text-warning",
  Unverified: "bg-muted text-muted-foreground",
};

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [freezingId, setFreezingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await adminService.getAllUsers();
        setUsers(res.data.users || res.data || []);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  const toggleFreeze = async (id: string) => {
    setFreezingId(id);
    try {
      await adminService.freezeUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isFrozen: !u.isFrozen } : u)));
    } catch {
      alert("Failed to update user status");
    } finally {
      setFreezingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">User Management</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, email, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Phone</TableHead>
                <TableHead className="hidden md:table-cell">KYC</TableHead>
                <TableHead className="hidden lg:table-cell">Trades</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                filtered.map((u) => (
                  <TableRow key={u.id} className={`border-border ${u.isFrozen ? "opacity-60" : ""}`}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{u.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{u.phone}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${kycColors[u.kycStatus] || ""}`}>{u.kycStatus}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{u.trades}</TableCell>
                    <TableCell className="font-semibold text-sm">{u.balance}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={u.isFrozen ? "default" : "destructive"}
                        onClick={() => toggleFreeze(u.id)}
                        disabled={freezingId === u.id}
                        className="gap-1 text-xs"
                      >
                        {u.isFrozen ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                        {u.isFrozen ? "Unfreeze" : "Freeze"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
