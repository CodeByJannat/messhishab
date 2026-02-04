import { memo, useRef, useEffect, useState } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { useLanguage } from '@/contexts/LanguageContext';

interface Message {
  id: string;
  message: string;
  sender_type: 'manager' | 'member' | 'admin';
  created_at: string;
  is_read: boolean;
}

interface ChatAreaProps {
  messages: Message[];
  recipientName: string;
  isLoading?: boolean;
  isSending?: boolean;
  onSendMessage: (message: string) => void;
  currentUserType: 'manager' | 'member';
  emptyStateText?: string;
}

export const ChatArea = memo(function ChatArea({
  messages,
  recipientName,
  isLoading = false,
  isSending = false,
  onSendMessage,
  currentUserType,
  emptyStateText,
}: ChatAreaProps) {
  const { language } = useLanguage();
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim() || isSending) return;
    onSendMessage(newMessage.trim());
    setNewMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-primary font-bold">
            {recipientName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-semibold">{recipientName}</p>
          <p className="text-xs text-muted-foreground">
            {currentUserType === 'manager' 
              ? (language === 'bn' ? 'মেম্বার' : 'Member')
              : (language === 'bn' ? 'ম্যানেজার' : 'Manager')
            }
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center">
            <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {emptyStateText || (language === 'bn' ? 'এখনো কোনো মেসেজ নেই' : 'No messages yet')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === 'bn' ? 'কথোপকথন শুরু করুন!' : 'Start the conversation!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg.message}
                senderType={msg.sender_type}
                createdAt={msg.created_at}
                isOwn={msg.sender_type === currentUserType}
              />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'bn' ? 'মেসেজ লিখুন...' : 'Type a message...'}
            className="min-h-[50px] max-h-[120px] resize-none rounded-xl"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="h-[50px] w-[50px] rounded-xl shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
