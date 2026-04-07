import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SignIn = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!phone || !password || !pin) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(phone, password, pin);
      // Check if user is admin and redirect accordingly
      const stored = localStorage.getItem("user_profile");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role === "admin" || user.role === "super_admin") {
          navigate("/admin", { replace: true });
          return;
        }
      }
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-6">
      <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-8">
        <ArrowLeft size={18} className="text-foreground" />
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm mb-8">Sign in to continue trading</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            type="tel"
            className="w-full h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
          />
          <div className="relative">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              className="w-full h-14 rounded-xl bg-secondary px-4 pr-12 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit PIN"
            type="password"
            maxLength={6}
            className="w-full h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 tracking-[0.3em] text-center"
          />
        </div>

        <button onClick={() => navigate("/forgot-password")} className="text-sm text-primary font-medium mt-3 mb-6">Forgot password?</button>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : "Sign In"}
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <button onClick={() => navigate("/signup")} className="text-primary font-semibold">Sign up</button>
        </p>
      </motion.div>
    </div>
  );
};

export default SignIn;
