import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, Zap, Clock } from "lucide-react";

const SplashScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-6 py-12">
      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center mb-6 animate-pulse-glow"
        >
          <span className="text-4xl font-extrabold text-primary-foreground">CF</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-extrabold text-foreground mb-2"
        >
          Card<span className="text-gradient">Flip</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-muted-foreground text-center text-lg max-w-xs"
        >
          Trade gift cards for instant Naira. Fast, safe, and reliable.
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 space-y-4 w-full max-w-xs"
        >
          {[
            { icon: Zap, text: "Instant payouts to your bank" },
            { icon: Shield, text: "Bank-grade security & KYC" },
            { icon: Clock, text: "Trades processed in minutes" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.15 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <item.icon size={18} className="text-primary" />
              </div>
              <span className="text-sm text-foreground/80">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="w-full max-w-xs space-y-3"
      >
        <button
          onClick={() => navigate("/signup")}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          Get Started
          <ArrowRight size={18} />
        </button>
        <button
          onClick={() => navigate("/signin")}
          className="w-full h-14 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-base hover:bg-secondary/80 transition-colors"
        >
          I have an account
        </button>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
