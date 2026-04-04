import api from "./api";

/** Admin-only API endpoints */
export const adminService = {
  getDashboardStats: () =>
    api.get("/admin/dashboard/stats"),

  getPendingTrades: () =>
    api.get("/admin/trades/pending"),

  approveTrade: (id: string, note?: string) =>
    api.patch(`/admin/trades/${id}/approve`, { admin_note: note }),

  rejectTrade: (id: string, note?: string) =>
    api.patch(`/admin/trades/${id}/reject`, { admin_note: note }),

  getAllTrades: (page = 1, status?: string) =>
    api.get("/admin/trades", { params: { page, status } }),

  getAllUsers: (page = 1) =>
    api.get("/admin/users", { params: { page } }),

  freezeUser: (id: string) =>
    api.patch(`/admin/users/${id}/freeze`),

  getRates: () =>
    api.get("/admin/rates"),

  createRate: (data: { card_brand_id: string; card_type: string; denomination: string; rate_per_dollar: number }) =>
    api.post("/admin/rates", data),

  updateRate: (id: string, data: { rate_per_dollar?: number; is_active?: boolean }) =>
    api.patch(`/admin/rates/${id}`, data),

  getPendingPayouts: () =>
    api.get("/admin/payouts/pending"),

  processPayout: (id: string) =>
    api.post(`/admin/payouts/${id}/process`),

  getTickets: () =>
    api.get("/admin/support/tickets"),

  replyToTicket: (id: string, message: string) =>
    api.post(`/admin/support/tickets/${id}/reply`, { message }),
};
