import { memo } from 'react';
import { User, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: string;
  senderType: 'manager' | 'member' | 'admin';
  senderName?: string;
  createdAt: string;
  isOwn: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  senderType,
  senderName,
  createdAt,
  isOwn,
}: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%]">
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                senderType === 'admin'
                  ? 'bg-destructive'
                  : senderType === 'manager'
                  ? 'bg-primary'
                  : 'bg-accent'
              }`}
            >
              {senderType === 'admin' ? (
                <Shield className="w-3 h-3 text-white" />
              ) : (
                <User className="w-3 h-3 text-white" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {senderName || (senderType === 'admin' ? 'Admin' : senderType === 'manager' ? 'Manager' : 'Member')}
            </span>
          </div>
        )}
        <div
          className={`p-3 rounded-2xl ${
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm">{message}</p>
        </div>
        <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
          {format(new Date(createdAt), 'HH:mm')}
        </p>
      </div>
    </div>
  );
});
