import api from "./api";

export interface ReferralStats {
  total_referrals: number;
  total_earned: number;
  referral_code: string;
  referral_link: string;
}

export interface Referral {
  id: string;
  referred_name: string;
  bonus_amount: number;
  is_paid: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const referralService = {
  getStats: () =>
    api.get<ReferralStats>("/referrals/stats"),

  getHistory: () =>
    api.get<Referral[]>("/referrals/history"),
};

export const notificationService = {
  getAll: () =>
    api.get<Notification[]>("/notifications"),

  markAllRead: () =>
    api.patch("/notifications/read-all"),
};
