-- FamBase Row Level Security (RLS) Policies
-- Comprehensive security policies for all tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_sender_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Users can read their own profile and public info of others
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (NOT is_deleted);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- CONTACTS POLICIES
-- Users can only manage their own contacts
CREATE POLICY "Users can view own contacts" ON contacts
  FOR SELECT USING (auth.uid() = owner);

CREATE POLICY "Users can insert own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = owner);

CREATE POLICY "Users can delete own contacts" ON contacts
  FOR DELETE USING (auth.uid() = owner);

-- CONVERSATIONS POLICIES
-- Users can only see conversations they are members of
CREATE POLICY "Members can view conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update group conversations" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = id 
      AND cm.user_id = auth.uid()
      AND (cm.is_admin = true OR NOT is_group)
    )
  );

-- CONVERSATION_MEMBERS POLICIES
-- Users can view members of conversations they belong to
CREATE POLICY "Members can view conversation members" ON conversation_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Admins can add members" ON conversation_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.is_admin = true
    )
    OR 
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can leave conversations" ON conversation_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update member roles" ON conversation_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.is_admin = true
    )
  );

-- MESSAGES POLICIES
-- Users can only see messages in conversations they are members of
CREATE POLICY "Members can view messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Members can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Senders can update own messages" ON messages
  FOR UPDATE USING (
    auth.uid() = sender_id
    AND deleted_at IS NULL
    AND (edited_at IS NULL OR edited_at > NOW() - INTERVAL '15 minutes')
  );

CREATE POLICY "Senders can delete own messages" ON messages
  FOR DELETE USING (
    auth.uid() = sender_id
    AND created_at > NOW() - INTERVAL '1 hour'
  );

-- MESSAGE_REACTIONS POLICIES
CREATE POLICY "Members can view reactions" ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Members can add reactions" ON message_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Users can remove own reactions" ON message_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- MESSAGE_RECEIPTS POLICIES
CREATE POLICY "Members can view receipts" ON message_receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_members cm ON m.conversation_id = cm.conversation_id
      WHERE m.id = message_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Users can insert own receipts" ON message_receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts" ON message_receipts
  FOR UPDATE USING (auth.uid() = user_id);

-- TYPING_STATUS POLICIES
CREATE POLICY "Members can view typing status" ON typing_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Users can update own typing status" ON typing_status
  FOR ALL USING (auth.uid() = user_id);

-- PRESENCE POLICIES
CREATE POLICY "Users can view presence of contacts" ON presence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.contact_user_id = user_id 
      AND c.owner = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can update own presence" ON presence
  FOR ALL USING (auth.uid() = user_id);

-- DEVICES POLICIES
CREATE POLICY "Users can view own devices" ON devices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public keys of contacts" ON devices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.contact_user_id = user_id 
      AND c.owner = auth.uid()
    )
  );

CREATE POLICY "Users can manage own devices" ON devices
  FOR ALL USING (auth.uid() = user_id);

-- GROUP_SENDER_KEYS POLICIES
CREATE POLICY "Recipients can view their encrypted keys" ON group_sender_keys
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Senders can insert keys for group members" ON group_sender_keys
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = group_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

-- CALL_SIGNALS POLICIES
CREATE POLICY "Participants can view call signals" ON call_signals
  FOR SELECT USING (
    auth.uid() = from_user 
    OR auth.uid() = to_user
    OR EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Users can send call signals" ON call_signals
  FOR INSERT WITH CHECK (
    auth.uid() = from_user
    AND EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

-- CALL_HISTORY POLICIES
CREATE POLICY "Participants can view call history" ON call_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Users can create call history" ON call_history
  FOR INSERT WITH CHECK (auth.uid() = initiated_by);

-- STATUSES POLICIES
CREATE POLICY "Users can view statuses from contacts" ON statuses
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.contact_user_id = user_id 
      AND c.owner = auth.uid()
      AND c.is_blocked = false
    )
  );

CREATE POLICY "Users can manage own statuses" ON statuses
  FOR ALL USING (auth.uid() = user_id);

-- STATUS_VIEWS POLICIES
CREATE POLICY "Status owners can view who viewed" ON status_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM statuses s 
      WHERE s.id = status_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can record own views" ON status_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- BLOCKED_USERS POLICIES
CREATE POLICY "Users can view own blocked list" ON blocked_users
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage own blocks" ON blocked_users
  FOR ALL USING (auth.uid() = blocker_id);

-- REPORTED_CONTENT POLICIES
CREATE POLICY "Users can view own reports" ON reported_content
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports" ON reported_content
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- INVITE_LINKS POLICIES
CREATE POLICY "Group members can view invite links" ON invite_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.left_at IS NULL
    )
  );

CREATE POLICY "Group admins can manage invite links" ON invite_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_id 
      AND cm.user_id = auth.uid()
      AND cm.is_admin = true
      AND cm.left_at IS NULL
    )
  );

-- Additional security functions

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION is_user_blocked(blocker_uuid UUID, blocked_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM blocked_users 
    WHERE blocker_id = blocker_uuid 
    AND blocked_id = blocked_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check conversation membership
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_id = conv_id 
    AND user_id = user_uuid 
    AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin of conversation
CREATE OR REPLACE FUNCTION is_conversation_admin(conv_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM conversation_members 
    WHERE conversation_id = conv_id 
    AND user_id = user_uuid 
    AND is_admin = true 
    AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

