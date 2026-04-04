import api from "./api";

export interface Trade {
  id: string;
  user_id: string;
  card_brand: string;
  card_type: string;
  denomination: string;
  quantity: number;
  card_image_url: string | null;
  ecode: string | null;
  naira_amount: number;
  status: "Pending" | "Processing" | "Approved" | "Rejected" | "Paid";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubmitTradePayload {
  card_brand_id: string;
  card_type: string;
  denomination: string;
  quantity: number;
  ecode?: string;
}

export const tradeService = {
  submit: (data: FormData) =>
    api.post<Trade>("/trades/submit", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getAll: (page = 1, status?: string) =>
    api.get<{ trades: Trade[]; total: number }>("/trades", {
      params: { page, status },
    }),

  getById: (id: string) =>
    api.get<Trade>(`/trades/${id}`),

  getActive: () =>
    api.get<Trade[]>("/trades/active"),
};
