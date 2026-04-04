import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Reusable empty state placeholder with icon, text, and optional CTA.
 */
const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
      <Icon size={28} className="text-muted-foreground/40" />
    </div>
    <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} size="sm" className="rounded-xl font-semibold">
        {actionLabel}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
