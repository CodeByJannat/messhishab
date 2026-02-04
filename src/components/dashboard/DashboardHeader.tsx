import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function DashboardHeader({ title, subtitle, children, className }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {children}
        </div>
      )}
    </motion.div>
  );
}
