import { memo } from 'react';
import { User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';

interface Member {
  id: string;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface ConversationListProps {
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  isLoading?: boolean;
}

export const ConversationList = memo(function ConversationList({
  members,
  selectedMemberId,
  onSelectMember,
  isLoading = false,
}: ConversationListProps) {
  const { language } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-10 h-10 bg-muted rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
        <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">
          {language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members yet'}
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {members.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelectMember(member.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              selectedMemberId === member.id
                ? 'bg-primary/10 border border-primary'
                : 'hover:bg-muted'
            }`}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              {member.unreadCount && member.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                  {member.unreadCount > 9 ? '9+' : member.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium truncate">{member.name}</p>
                {member.lastMessageTime && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(member.lastMessageTime), 'HH:mm')}
                  </span>
                )}
              </div>
              {member.lastMessage && (
                <p className="text-sm text-muted-foreground truncate">{member.lastMessage}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
});
