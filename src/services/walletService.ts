import api from "./api";

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: "credit" | "debit" | "fee";
  amount: number;
  description: string;
  reference: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

export const walletService = {
  getBalance: () =>
    api.get<WalletBalance>("/wallet/balance"),

  getTransactions: (page = 1) =>
    api.get<{ transactions: Transaction[]; total: number }>("/wallet/transactions", {
      params: { page },
    }),

  withdraw: (amount: number, bank_account_id: string, pin: string) =>
    api.post("/wallet/withdraw", { amount, bank_account_id, pin }),

  addBank: (bank_code: string, account_number: string) =>
    api.post<BankAccount>("/wallet/add-bank", { bank_code, account_number }),

  getBanks: () =>
    api.get<BankAccount[]>("/wallet/banks"),

  deleteBank: (id: string) =>
    api.delete(`/wallet/banks/${id}`),
};
