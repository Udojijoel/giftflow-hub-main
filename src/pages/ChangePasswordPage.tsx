import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import api from "@/services/api";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!current || !newPass || !confirm) return setError("All fields are required");
    if (newPass.length < 8) return setError("New password must be at least 8 characters");
    if (newPass !== confirm) return setError("Passwords do not match");
    setLoading(true);
    setError("");
    try {
      await api.put("/auth/change-password", { current_password: current, new_password: newPass });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
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
        <h2 className="text-xl font-bold text-foreground mb-2">Password Changed</h2>
        <p className="text-sm text-muted-foreground mb-6">Your password has been updated successfully.</p>
        <button onClick={() => navigate("/profile")} className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-semibold">Back to Profile</button>
      </div>
    );
  }

  const field = (label: string, value: string, onChange: (v: string) => void, key: "current" | "new" | "confirm") => (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={show[key] ? "text" : "password"}
          className="w-full h-13 rounded-xl bg-secondary px-4 pr-12 text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
          {show[key] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-5 py-6">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Change Password</h1>
      </div>

      {error && <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">{error}</div>}

      <div className="space-y-4">
        {field("Current Password", current, setCurrent, "current")}
        {field("New Password", newPass, setNewPass, "new")}
        {field("Confirm New Password", confirm, setConfirm, "confirm")}
      </div>

      <button onClick={handleSubmit} disabled={loading} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold mt-8 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : "Update Password"}
      </button>
    </div>
  );
};

export default ChangePasswordPage;
