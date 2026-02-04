import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  icon: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
}

export function InfoCard({ 
  icon: Icon, 
  iconColor = 'text-primary',
  children, 
  className,
  variant = 'default'
}: InfoCardProps) {
  const variantClasses = {
    default: 'bg-card border',
    glass: 'glass-card',
    gradient: 'bg-gradient-to-br from-card to-muted/30 border',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn(
        "overflow-hidden",
        variantClasses[variant],
        className
      )}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className={cn(
              "flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center"
            )}>
              <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              {children}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface HighlightCardProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: 'warning' | 'success' | 'info' | 'destructive';
  className?: string;
}

export function HighlightCard({ 
  title, 
  description, 
  action, 
  variant = 'warning',
  className 
}: HighlightCardProps) {
  const variantClasses = {
    warning: 'border-warning/30 bg-warning/5',
    success: 'border-success/30 bg-success/5',
    info: 'border-accent/30 bg-accent/5',
    destructive: 'border-destructive/30 bg-destructive/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-2xl border p-5 sm:p-6",
        variantClasses[variant],
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {description}
          </p>
        </div>
        {action}
      </div>
    </motion.div>
  );
}
