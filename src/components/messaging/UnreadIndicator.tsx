import { memo } from 'react';

interface UnreadIndicatorProps {
  count?: number;
  showCount?: boolean;
  className?: string;
}

export const UnreadIndicator = memo(function UnreadIndicator({
  count = 0,
  showCount = false,
  className = '',
}: UnreadIndicatorProps) {
  if (count === 0) return null;

  if (showCount && count > 0) {
    return (
      <span className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold bg-destructive text-destructive-foreground rounded-full animate-pulse ${className}`}>
        {count > 99 ? '99+' : count}
      </span>
    );
  }

  return <span className={`unread-dot ${className}`} />;
});
