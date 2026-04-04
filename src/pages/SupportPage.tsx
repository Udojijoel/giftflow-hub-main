import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Send, Paperclip, MessageCircle } from "lucide-react";
import { supportService, type SupportTicket, type SupportMessage } from "@/services/supportService";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectionError from "@/components/shared/ConnectionError";
import EmptyState from "@/components/shared/EmptyState";

const SupportPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "chat">("list");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        const res = await supportService.getTickets();
        setTickets(res.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView("chat");
    setLoadingChat(true);
    try {
      const res = await supportService.getTicket(ticket.id);
      setMessages(res.data.messages);
    } catch {
      setMessages([]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedTicket || sending) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("message", message);
      const res = await supportService.sendMessage(selectedTicket.id, formData);
      setMessages((prev) => [...prev, res.data]);
      setMessage("");
    } catch {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (view === "chat" && selectedTicket) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border/30">
          <button onClick={() => setView("list")} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-foreground">{selectedTicket.id}</h1>
            <p className="text-xs text-muted-foreground">{selectedTicket.subject}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loadingChat ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-3/4 rounded-2xl" />
            ))
          ) : messages.length > 0 ? (
            messages.map((msg, i) => {
              const isUser = msg.sender_id !== "admin";
              return (
                <motion.div key={msg.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border/30 text-foreground rounded-bl-md"}`}>
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isUser ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No messages yet</p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-border/30 flex items-center gap-2">
          <button className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Paperclip size={16} className="text-muted-foreground" />
          </button>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 h-10 rounded-xl bg-secondary px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button onClick={handleSend} disabled={sending || !message.trim()} className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 disabled:opacity-50">
            <Send size={16} className="text-primary-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground flex-1">Support</h1>
        <button className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><Plus size={16} className="text-primary-foreground" /></button>
      </div>

      <div className="px-5 space-y-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))
        ) : tickets.length > 0 ? (
          tickets.map((ticket) => (
            <button key={ticket.id} onClick={() => openTicket(ticket)} className="w-full p-4 rounded-xl bg-card border border-border/30 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ticket.status === "Open" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{ticket.status}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
            </button>
          ))
        ) : (
          <EmptyState icon={MessageCircle} title="No support tickets" description="Need help? Tap the + button to create a support ticket." />
        )}
      </div>
    </div>
  );
};

export default SupportPage;
