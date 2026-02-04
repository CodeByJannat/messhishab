import { memo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User, Users, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Member {
  id: string;
  name: string;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSendMessage: (memberIds: string[], message: string, isBroadcast: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const NewMessageModal = memo(function NewMessageModal({
  isOpen,
  onClose,
  members,
  onSendMessage,
  isLoading = false,
}: NewMessageModalProps) {
  const { language } = useLanguage();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSelectMember = (memberId: string) => {
    setIsBroadcast(false);
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    setIsBroadcast(true);
    setSelectedMembers([]);
  };

  const handleSend = async () => {
    if (!message.trim() || (!isBroadcast && selectedMembers.length === 0)) return;
    
    setIsSending(true);
    try {
      await onSendMessage(selectedMembers, message.trim(), isBroadcast);
      setMessage('');
      setSelectedMembers([]);
      setIsBroadcast(false);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setSelectedMembers([]);
    setIsBroadcast(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'bn' ? 'নতুন মেসেজ' : 'New Message'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipient Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'bn' ? 'প্রাপক নির্বাচন করুন' : 'Select Recipients'}
            </label>
            
            {/* Broadcast Option */}
            <button
              onClick={handleSelectAll}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isBroadcast
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isBroadcast ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">
                  {language === 'bn' ? 'সবাইকে মেসেজ' : 'Message All'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'bn' ? 'সকল মেম্বারকে মেসেজ পাঠান' : 'Send to all members'}
                </p>
              </div>
              {isBroadcast && <Check className="w-5 h-5 text-primary" />}
            </button>

            {/* Individual Members */}
            <ScrollArea className="h-[200px] border rounded-xl">
              <div className="p-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {language === 'bn' ? 'কোনো মেম্বার নেই' : 'No members'}
                  </div>
                ) : (
                  members.map((member) => {
                    const isSelected = selectedMembers.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member.id)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                          isSelected
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="flex-1 text-left text-sm">{member.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'bn' ? 'মেসেজ' : 'Message'}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={language === 'bn' ? 'আপনার মেসেজ লিখুন...' : 'Type your message...'}
              className="min-h-[100px] rounded-xl"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {language === 'bn' ? 'বাতিল' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || (!isBroadcast && selectedMembers.length === 0) || isSending}
          >
            {isSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {language === 'bn' ? 'পাঠান' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
