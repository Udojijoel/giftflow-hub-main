import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import api from "@/services/api";

const ChangePinPage = () => {
  const navigate = useNavigate();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const sanitize = (v: string) => v.replace(/\D/g, "").slice(0, 6);

  const handleSubmit = async () => {
    if (!currentPin || !newPin || !confirmPin) return setError("All fields are required");
    if (newPin.length !== 6) return setError("New PIN must be exactly 6 digits");
    if (newPin !== confirmPin) return setError("PINs do not match");
    if (newPin === currentPin) return setError("New PIN must be different from current PIN");
    setLoading(true);
    setError("");
    try {
      await api.put("/auth/change-pin", { current_pin: currentPin, new_pin: newPin });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change PIN");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">PIN Changed</h2>
        <p className="text-sm text-muted-foreground mb-6">Your transaction PIN has been updated.</p>
        <button onClick={() => navigate("/profile")} className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold">Back to Profile</button>
      </div>
    );
  }

  const pinField = (label: string, value: string, onChange: (v: string) => void) => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(sanitize(e.target.value))}
        type="password"
        maxLength={6}
        inputMode="numeric"
        className="w-full h-13 rounded-xl bg-secondary px-4 text-foreground outline-none focus:ring-2 focus:ring-primary/50 tracking-[0.4em] text-center text-lg"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-5 py-6">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Change PIN</h1>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="space-y-4">
        {pinField("Current PIN", currentPin, setCurrentPin)}
        {pinField("New PIN (6 digits)", newPin, setNewPin)}
        {pinField("Confirm New PIN", confirmPin, setConfirmPin)}
      </div>

      <button onClick={handleSubmit} disabled={loading} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold mt-8 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : "Update PIN"}
      </button>
    </div>
  );
};

export default ChangePinPage;
