import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";

const SignUp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<"phone" | "otp" | "password" | "pin">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stepConfig = {
    phone: { title: "Enter your phone number", subtitle: "We'll send a verification code" },
    otp: { title: "Verify your number", subtitle: `Enter the 6-digit code sent to ${phone}` },
    password: { title: "Create your account", subtitle: "Set your name and password" },
    pin: { title: "Set your PIN", subtitle: "Create a 6-digit PIN for transactions" },
  };

  const handleNext = async () => {
    setError("");
    setLoading(true);
    try {
      if (step === "phone") {
        if (!phone) { setError("Enter your phone number"); return; }
        // In production, this would trigger OTP send from backend
        setStep("otp");
      } else if (step === "otp") {
        if (otp.length !== 6) { setError("Enter the full 6-digit code"); return; }
        await authService.verifyOtp(phone, otp);
        setStep("password");
      } else if (step === "password") {
        if (!fullName || !password) { setError("Fill in all fields"); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
        setStep("pin");
      } else if (step === "pin") {
        if (pin.length !== 6) { setError("Enter a full 6-digit PIN"); return; }
        const res = await authService.register({ phone, password, pin, full_name: fullName });
        // Auto-login after registration
        localStorage.setItem("access_token", res.data.accessToken);
        localStorage.setItem("user_profile", JSON.stringify(res.data.user));
        navigate("/dashboard", { replace: true });
        // Force page reload so AuthContext picks up the new session
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setError("");
    if (step === "phone") navigate(-1);
    else if (step === "otp") setStep("phone");
    else if (step === "password") setStep("otp");
    else setStep("password");
  };

  return (
    <div className="min-h-screen bg-background px-6 py-6">
      <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-8">
        <ArrowLeft size={18} className="text-foreground" />
      </button>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-foreground mb-1">{stepConfig[step].title}</h1>
        <p className="text-muted-foreground text-sm mb-8">{stepConfig[step].subtitle}</p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {step === "phone" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="w-20 h-14 rounded-xl bg-secondary flex items-center justify-center text-sm font-semibold text-foreground">🇳🇬 +234</div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="8012345678" className="flex-1 h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 text-base" type="tel" maxLength={11} />
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="flex gap-2 justify-center">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                maxLength={1}
                value={otp[i] || ""}
                onChange={(e) => {
                  const val = otp.split("");
                  val[i] = e.target.value;
                  setOtp(val.join(""));
                  if (e.target.value && e.target.nextElementSibling) {
                    (e.target.nextElementSibling as HTMLInputElement).focus();
                  }
                }}
                className="w-12 h-14 rounded-xl bg-secondary text-center text-xl font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/50"
              />
            ))}
          </div>
        )}

        {step === "password" && (
          <div className="space-y-4">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" className="w-full h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="relative">
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type={showPassword ? "text" : "password"} className="w-full h-14 rounded-xl bg-secondary px-4 pr-12 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}

        {step === "pin" && (
          <div className="flex gap-2 justify-center">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                maxLength={1}
                type="password"
                value={pin[i] || ""}
                onChange={(e) => {
                  const val = pin.split("");
                  val[i] = e.target.value;
                  setPin(val.join(""));
                  if (e.target.value && e.target.nextElementSibling) {
                    (e.target.nextElementSibling as HTMLInputElement).focus();
                  }
                }}
                className="w-12 h-14 rounded-xl bg-secondary text-center text-xl font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/50"
              />
            ))}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base mt-8 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Please wait...</> : step === "pin" ? "Create Account" : "Continue"}
        </button>

        {step === "otp" && (
          <button className="w-full text-center text-sm text-primary font-medium mt-4">Resend code</button>
        )}
      </motion.div>
    </div>
  );
};

export default SignUp;
