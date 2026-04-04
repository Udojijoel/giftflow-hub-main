import api from "./api";

export interface SupportTicket {
  id: string;
  trade_id: string | null;
  subject: string;
  status: "Open" | "Resolved" | "Closed";
  created_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  attachment_url: string | null;
  created_at: string;
}

export const supportService = {
  getTickets: () =>
    api.get<SupportTicket[]>("/support/tickets"),

  getTicket: (id: string) =>
    api.get<{ ticket: SupportTicket; messages: SupportMessage[] }>(`/support/tickets/${id}`),

  createTicket: (subject: string, message: string, trade_id?: string) =>
    api.post<SupportTicket>("/support/tickets", { subject, message, trade_id }),

  sendMessage: (ticketId: string, data: FormData) =>
    api.post<SupportMessage>(`/support/tickets/${ticketId}/messages`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};
