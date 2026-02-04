
# Messaging System Overhaul Plan

## Overview
This plan transforms the current notification-based system into a modern messaging platform with WhatsApp/Messenger-like UX for both Manager and Member dashboards, while integrating Admin messages into the Manager Help Desk.

---

## Current State Analysis

### Existing Components:
- **Manager Dashboard**: `NotificationsPage.tsx` - sends one-way notifications to members
- **Member Dashboard**: `MemberNotificationsPage.tsx` - views notifications, `MemberContactPage.tsx` - sends messages to manager
- **Admin Dashboard**: `AdminMessagesPage.tsx` - sends messages to messes, `AdminHelpDeskPage.tsx` - ticket-based support

### Database Tables:
- `notifications` - stores manager-to-member messages and member-to-manager messages
- `admin_messages` - stores admin broadcast messages
- `help_desk_tickets` / `help_desk_messages` - support ticket system

---

## Proposed Changes

### 1. Manager Dashboard - New "Messages" Page

**Replace** `/manager/notifications` with `/manager/messages`

**UI Design (Messenger/WhatsApp Style):**
```text
+--------------------------------------------------+
| Messages                           [+ New Message]|
+--------------------------------------------------+
| [Individual] | [Group/Broadcast]                  |
+--------------------------------------------------+
| Conversations List     |  Chat Area              |
| +--------------------+ | +----------------------+|
| | Member A        ●  | | | Member A             ||
| | Last message...    | | | -------------------- ||
| +--------------------+ | | [msg] [msg] [msg]    ||
| | Member B           | | |                      ||
| | Last message...    | | | [Type message...]    ||
| +--------------------+ | +----------------------+|
+--------------------------------------------------+
```

**Features:**
- **Two Tabs**: Individual Messages & Group/Broadcast Messages
- **Plus (+) Button**: Opens modal to start new conversation (select member or "All Members")
- **Real-time Updates**: Using Supabase Realtime
- **Message History**: Full conversation thread per member
- **New Message Indicator**: Blinking/highlighted tab when unread messages exist
- **Member can reply**: Two-way communication

---

### 2. Member Dashboard - Update "Message Manager" Page

**Update** `/member/contact` to match chat interface

**UI Design:**
```text
+--------------------------------------------------+
| Message Manager                                   |
+--------------------------------------------------+
| +----------------------------------------------+ |
| | Manager                                      | |
| | -------------------------------------------- | |
| | [Their msg]                    [My msg]      | |
| | [Their msg]              [My msg] [My msg]   | |
| |                                              | |
| | [Type message...              ] [Send]       | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

**Features:**
- **Chat-style interface**: Messages displayed as bubbles
- **Real-time updates**: See manager replies instantly
- **Message history**: View full conversation

---

### 3. Admin Dashboard - Updates

#### A. Message Center (Keep for Broadcasts)
- Admin messages go ONLY to **mess managers** (not members)
- Remove member visibility from admin messages

#### B. Help Desk - Add Admin Messages Section
Add a new section in Manager's Help Desk page to show:
- Admin messages received (global + mess-specific)
- Separated from support tickets

#### C. Blinking/Highlight Indicators
- **Message Center**: Highlight when there are recent messages
- **Help Desk**: Highlight when there are unread tickets or new contact messages

---

### 4. Database Changes

**New Table: `direct_messages`**
```sql
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id),
  member_id UUID NOT NULL REFERENCES members(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('manager', 'member')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- RLS Policies
-- Managers can read/write messages for their mess
-- Members can read/write their own messages (via edge function)
```

**New Table: `broadcast_messages`** (for group messages)
```sql
CREATE TABLE broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id UUID NOT NULL REFERENCES messes(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE broadcast_messages;
```

---

## File Changes Summary

### New Files to Create:
1. `src/pages/dashboard/MessagesPage.tsx` - New manager messaging page
2. `src/components/messaging/ConversationList.tsx` - Conversation sidebar
3. `src/components/messaging/ChatArea.tsx` - Chat message area
4. `src/components/messaging/NewMessageModal.tsx` - New message dialog
5. `src/components/messaging/MessageBubble.tsx` - Message bubble component
6. `src/hooks/useUnreadMessages.ts` - Hook for unread message count
7. `supabase/functions/get-conversations/index.ts` - Fetch conversations
8. `supabase/functions/send-direct-message/index.ts` - Send direct message

### Files to Modify:
1. `src/App.tsx` - Update routes (notifications → messages)
2. `src/components/dashboard/DashboardLayout.tsx` - Change nav item, add unread indicator
3. `src/components/dashboard/MemberDashboardLayout.tsx` - Add unread indicator
4. `src/components/admin/AdminDashboardLayout.tsx` - Add unread indicators
5. `src/pages/member/MemberContactPage.tsx` - Transform to chat UI
6. `src/pages/dashboard/ManagerHelpDeskPage.tsx` - Add Admin Messages section
7. `supabase/functions/get-member-portal-data/index.ts` - Include direct messages

### Files to Delete:
1. `src/pages/dashboard/NotificationsPage.tsx` - Replaced by MessagesPage

---

## Technical Details

### Unread Message Indicator Logic

```typescript
// useUnreadMessages.ts
const useUnreadMessages = (messId: string) => {
  const [hasUnread, setHasUnread] = useState(false);
  
  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel('unread-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `mess_id=eq.${messId}`,
      }, () => {
        setHasUnread(true);
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, [messId]);
  
  return { hasUnread, clearUnread: () => setHasUnread(false) };
};
```

### Blinking Animation CSS
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.unread-indicator {
  animation: pulse-dot 1.5s ease-in-out infinite;
}
```

### Admin Message Visibility Change
Modify `get-member-portal-data/index.ts` to NOT fetch admin messages for members:
- Admin messages should only be visible to managers
- Members see only manager-sent notifications

---

## Implementation Order

1. **Database Migration**: Create new tables with RLS policies
2. **Edge Functions**: Create message handling functions
3. **Manager Messages Page**: Build the new UI component
4. **Member Contact Page**: Transform to chat interface
5. **Unread Indicators**: Add to all dashboard layouts
6. **Manager Help Desk**: Add Admin Messages section
7. **Remove Old**: Delete notifications page, update routes
8. **Testing**: End-to-end testing of message flow

---

## Migration Strategy

1. Keep existing `notifications` table for backward compatibility during transition
2. New messages use `direct_messages` table
3. Display both old notifications and new messages in conversation view
4. Eventually deprecate old notifications table

---

## Security Considerations

- Members cannot see other members' messages
- Managers can only see messages for their own mess
- Admin messages are manager-only (update RLS on admin_messages if needed)
- All message sending goes through edge functions for PIN-authenticated members
