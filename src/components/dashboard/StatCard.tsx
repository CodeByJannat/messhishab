import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'primary' | 'success' | 'warning' | 'destructive' | 'accent' | 'secondary' | 'muted';
  trend?: {
    value: number;
    label: string;
  };
  delay?: number;
  className?: string;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    glow: 'shadow-primary/20',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    glow: 'shadow-success/20',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    glow: 'shadow-warning/20',
  },
  destructive: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    glow: 'shadow-destructive/20',
  },
  accent: {
    bg: 'bg-accent/10',
    text: 'text-accent',
    glow: 'shadow-accent/20',
  },
  secondary: {
    bg: 'bg-secondary/10',
    text: 'text-secondary',
    glow: 'shadow-secondary/20',
  },
  muted: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    glow: 'shadow-muted/20',
  },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary', 
  trend,
  delay = 0,
  className 
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay, 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-4 sm:p-5 transition-all duration-300",
        "hover:shadow-lg hover:border-border/80",
        `hover:${colors.glow}`,
        className
      )}
    >
      {/* Subtle gradient background on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        "bg-gradient-to-br from-transparent via-transparent to-primary/5"
      )} />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
            {title}
          </p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            {value}
          </p>
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.value >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        
        <div className={cn(
          "flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          colors.bg
        )}>
          <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", colors.text)} />
        </div>
      </div>
    </motion.div>
  );
}

// Compact variant for grids with many items
export function StatCardCompact({ 
  title, 
  value, 
  icon: Icon, 
  color = 'primary',
  delay = 0,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="group relative overflow-hidden rounded-xl border bg-card p-3 sm:p-4 hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className={cn(
          "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
          colors.bg
        )}>
          <Icon className={cn("w-5 h-5 sm:w-5.5 sm:h-5.5", colors.text)} />
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-foreground">{value}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-full">{title}</p>
        </div>
      </div>
    </motion.div>
  );
}
