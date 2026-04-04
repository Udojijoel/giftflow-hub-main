import api from "./api";

export interface RegisterPayload {
  phone: string;
  password: string;
  pin: string;
  full_name: string;
  referral_code?: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
  pin: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    phone: string;
    email: string | null;
    full_name: string;
    profile_photo: string | null;
    kyc_status: string;
    referral_code: string;
  };
}

export const authService = {
  register: (data: RegisterPayload) =>
    api.post<AuthResponse>("/auth/register", data),

  verifyOtp: (phone: string, otp: string) =>
    api.post("/auth/verify-otp", { phone, otp }),

  login: (data: LoginPayload) =>
    api.post<AuthResponse>("/auth/login", data),

  refreshToken: () =>
    api.post<{ accessToken: string }>("/auth/refresh-token"),

  forgotPassword: (phone: string) =>
    api.post("/auth/forgot-password", { phone }),

  resetPassword: (phone: string, otp: string, newPassword: string) =>
    api.post("/auth/reset-password", { phone, otp, new_password: newPassword }),

  logout: () => api.post("/auth/logout"),
};
