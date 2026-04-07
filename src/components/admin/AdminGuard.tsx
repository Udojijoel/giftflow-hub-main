import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import api from "@/services/api";

/**
 * Admin route guard.
 * Checks if the current user has admin privileges via the backend.
 * Falls back to a server-validated admin PIN if needed.
 */
export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  // If user has is_admin flag, automatically authenticate
  useEffect(() => {
    if (user?.is_admin) {
      setAuthenticated(true);
    }
  }, [user?.is_admin]);

  if (loading) return null;

  // Must be logged in first
  if (!user) return <Navigate to="/signin" replace />;

  const handleLogin = async () => {
    setChecking(true);
    setError("");
    try {
      // Validate admin PIN with backend
      await api.post("/admin/auth/verify", { pin });
      setAuthenticated(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid admin PIN");
    } finally {
      setChecking(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Admin Access</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your admin PIN to continue</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                maxLength={6}
                placeholder="6-digit PIN"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="pl-9 bg-card border-border text-center tracking-[0.5em] text-lg"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleLogin} disabled={pin.length !== 6 || checking}>
              {checking ? "Verifying..." : "Access Admin Panel"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
