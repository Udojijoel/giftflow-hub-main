import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Shield, Lock, Bell, Moon, Sun, LogOut, Camera, BadgeCheck, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [biometricEnabled, setBiometricEnabled] = useState(() => {
    return localStorage.getItem("biometric_enabled") === "true";
  });
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    // Check if Web Authentication API (biometric) is available
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then((available) => setBiometricSupported(available))
        .catch(() => setBiometricSupported(false));
    }
  }, []);

  const handleBiometricToggle = () => {
    const next = !biometricEnabled;
    setBiometricEnabled(next);
    localStorage.setItem("biometric_enabled", String(next));
  };

  const handleLogout = () => {
    logout();
    navigate("/signin", { replace: true });
  };

  const kycLabel = user?.kyc_status === "verified" ? "Verified" : user?.kyc_status === "pending" ? "Pending" : "Unverified";

  const sections = [
    {
      title: "Account",
      items: [
        { icon: BadgeCheck, label: "KYC Verification", desc: kycLabel, color: user?.kyc_status === "verified" ? "text-primary" : "text-warning", action: () => navigate("/kyc") },
        { icon: Lock, label: "Change PIN", desc: "Security", action: () => navigate("/change-pin") },
        { icon: Shield, label: "Change Password", desc: "Security", action: () => navigate("/change-password") },
      ],
    },
    {
      title: "Security",
      items: [
        ...(biometricSupported ? [{
          icon: Fingerprint,
          label: "Biometric Login",
          desc: biometricEnabled ? "Fingerprint / Face ID enabled" : "Use biometrics to sign in",
          toggle: true,
          checked: biometricEnabled,
          action: handleBiometricToggle,
        }] : []),
      ],
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", desc: "Push, email, SMS", action: () => navigate("/notifications") },
        { icon: isDark ? Moon : Sun, label: "Dark Mode", desc: isDark ? "Enabled" : "Disabled", toggle: true, checked: isDark, action: toggleTheme },
      ],
    },
  ].filter(s => s.items.length > 0);

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "??";

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Profile</h1>
      </div>

      {/* Avatar + Name */}
      <div className="px-5 mb-8 flex flex-col items-center">
        <div className="relative mb-3">
          {user?.profile_photo ? (
            <img src={user.profile_photo} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">{initials}</div>
          )}
          <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center"><Camera size={12} className="text-primary-foreground" /></button>
        </div>
        <h2 className="text-lg font-bold text-foreground">{user?.full_name || "Unknown User"}</h2>
        <p className="text-sm text-muted-foreground">{user?.phone || ""}</p>
        {user?.kyc_status === "verified" && (
          <span className="mt-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1"><BadgeCheck size={10} /> Verified</span>
        )}
      </div>

      {/* Settings */}
      <div className="px-5 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">{section.title}</h3>
            <div className="rounded-xl bg-card border border-border/30 overflow-hidden divide-y divide-border/30">
              {section.items.map((item) => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                    <item.icon size={16} className={item.color || "text-foreground"} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  {item.toggle ? (
                    <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${item.checked !== undefined ? (item.checked ? 'bg-primary' : 'bg-muted') : 'bg-primary'}`}>
                      <div className={`w-5 h-5 rounded-full bg-primary-foreground transition-transform ${item.checked !== undefined ? (item.checked ? 'ml-auto' : 'ml-0') : 'ml-auto'}`} />
                    </div>
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-xl bg-destructive/10 hover:bg-destructive/15 transition-colors">
          <LogOut size={16} className="text-destructive" />
          <span className="text-sm font-semibold text-destructive">Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
