import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, KeyRound, Lock, Loader2, CheckCircle2 } from "lucide-react";
import { authService } from "@/services/authService";

type Step = "phone" | "otp" | "reset" | "done";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stepConfig: Record<Step, { title: string; subtitle: string }> = {
    phone: { title: "Forgot Password", subtitle: "Enter your registered phone number" },
    otp: { title: "Enter OTP", subtitle: `We sent a 6-digit code to ${phone}` },
    reset: { title: "New Password", subtitle: "Create a strong new password" },
    done: { title: "Password Reset!", subtitle: "Your password has been changed successfully" },
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (step === "phone") {
        if (!phone) { setError("Enter your phone number"); setLoading(false); return; }
        await authService.forgotPassword(phone);
        setStep("otp");
      } else if (step === "otp") {
        if (otp.length !== 6) { setError("Enter the full 6-digit code"); setLoading(false); return; }
        setStep("reset");
      } else if (step === "reset") {
        if (password.length < 6) { setError("Password must be at least 6 characters"); setLoading(false); return; }
        if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
        await authService.resetPassword(phone, otp, password);
        setStep("done");
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
    else if (step === "reset") setStep("otp");
    else navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-background px-6 py-6">
      {step !== "done" && (
        <button onClick={goBack} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-8">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
      )}

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        {step === "done" ? (
          <div className="flex flex-col items-center justify-center pt-20 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              <CheckCircle2 size={72} className="text-primary mb-6" />
            </motion.div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{stepConfig.done.title}</h1>
            <p className="text-muted-foreground text-sm mb-10">{stepConfig.done.subtitle}</p>
            <button
              onClick={() => navigate("/signin", { replace: true })}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 transition-opacity"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-foreground mb-1">{stepConfig[step].title}</h1>
            <p className="text-muted-foreground text-sm mb-8">{stepConfig[step].subtitle}</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>
            )}

            {step === "phone" && (
              <div className="flex gap-2">
                <div className="w-20 h-14 rounded-xl bg-secondary flex items-center justify-center text-sm font-semibold text-foreground">🇳🇬 +234</div>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="8012345678"
                  type="tel"
                  maxLength={11}
                  className="flex-1 h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50 text-base"
                />
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

            {step === "reset" && (
              <div className="space-y-4">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password"
                  type="password"
                  className="w-full h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  type="password"
                  className="w-full h-14 rounded-xl bg-secondary px-4 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base mt-8 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Please wait...</> : step === "reset" ? "Reset Password" : "Continue"}
            </button>

            {step === "otp" && (
              <button
                onClick={async () => {
                  try { await authService.forgotPassword(phone); } catch { /* ignore */ }
                }}
                className="w-full text-center text-sm text-primary font-medium mt-4"
              >
                Resend code
              </button>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
