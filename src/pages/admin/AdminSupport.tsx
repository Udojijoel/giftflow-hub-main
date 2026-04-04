import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

interface Ticket {
  id: string;
  user: string;
  subject: string;
  tradeId: string;
  status: string;
  date: string;
  messages: { sender: string; text: string; time: string }[];
}

const AdminSupport = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await adminService.getTickets();
        setTickets(res.data || []);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const handleReply = async () => {
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      await adminService.replyToTicket(selected.id, reply);
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, { sender: "Admin", text: reply, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }],
            }
          : null
      );
      setReply("");
    } catch {
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (selected) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to tickets
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">{selected.subject}</h2>
            <p className="text-sm text-muted-foreground">{selected.user} · {selected.id}{selected.tradeId && ` · ${selected.tradeId}`}</p>
          </div>
          <Badge variant={selected.status === "Open" ? "outline" : "secondary"}>{selected.status}</Badge>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
            {selected.messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === "Admin" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${m.sender === "Admin" ? "bg-primary/10 text-foreground" : "bg-secondary text-foreground"}`}>
                  {m.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1">{m.sender} · {m.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Textarea placeholder="Type your reply..." value={reply} onChange={(e) => setReply(e.target.value)} className="bg-card border-border flex-1" rows={2} />
          <Button size="icon" className="self-end" disabled={!reply.trim() || sending} onClick={handleReply}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))
        ) : tickets.length > 0 ? (
          tickets.map((t) => (
            <Card key={t.id} className="border-border bg-card cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => setSelected(t)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{t.user} · {t.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.status === "Open" ? "outline" : "secondary"}>{t.status}</Badge>
                  <span className="text-xs text-muted-foreground">{t.messages.length}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">No support tickets</p>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
