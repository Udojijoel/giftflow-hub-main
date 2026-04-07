import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService, type AuthResponse } from "@/services/authService";

export interface User {
  id: string;
  phone: string;
  email: string | null;
  full_name: string;
  profile_photo: string | null;
  kyc_status: string;
  referral_code: string;
  role?: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string, pin: string) => Promise<void>;
  register: (data: { phone: string; password: string; pin: string; full_name: string; referral_code?: string }) => Promise<AuthResponse>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore user from localStorage on mount
    const token = localStorage.getItem("access_token");
    const stored = localStorage.getItem("user_profile");
    if (token && stored) {
      try {
        const userData = JSON.parse(stored);
        // Ensure is_admin is set based on role
        const userWithRole = {
          ...userData,
          is_admin: userData.role === "admin" || userData.role === "super_admin",
        };
        setUser(userWithRole);
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (phone: string, password: string, pin: string) => {
    const res = await authService.login({ phone, password, pin });
    const { accessToken, user: userData } = res.data;
    
    // Map backend role to is_admin flag
    const userWithRole = {
      ...userData,
      is_admin: userData.role === "admin" || userData.role === "super_admin",
    };
    
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user_profile", JSON.stringify(userWithRole));
    setUser(userWithRole as User);
  };

  const register = async (data: { phone: string; password: string; pin: string; full_name: string; referral_code?: string }) => {
    const res = await authService.register(data);
    return res.data;
  };

  const logout = async () => {
    try { await authService.logout(); } catch { /* ignore */ }
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_profile");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
