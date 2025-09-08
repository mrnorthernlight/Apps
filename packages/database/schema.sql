-- FamBase Database Schema
-- Full WhatsApp clone schema with E2EE support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  phone TEXT UNIQUE,
  phone_hash TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  about TEXT DEFAULT 'Hey there! I am using FamBase.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{
    "privacy": {
      "lastSeen": "everyone",
      "readReceipts": true,
      "profilePhoto": "everyone",
      "about": "everyone"
    },
    "notifications": {
      "messageNotifications": true,
      "groupNotifications": true,
      "callNotifications": true,
      "soundEnabled": true
    },
    "chat": {
      "autoDownloadMedia": true,
      "defaultDisappearingMessages": null,
      "fontSize": "medium"
    },
    "security": {
      "twoFactorEnabled": false,
      "backupEnabled": false
    }
  }'::JSONB
);

-- Create indexes for profiles
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_phone_hash ON profiles(phone_hash);
CREATE INDEX idx_profiles_display_name ON profiles USING GIN(display_name gin_trgm_ops);

-- contacts table (per-user local cache & optional server sync)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID REFERENCES auth.users ON DELETE CASCADE,
  contact_phone TEXT,
  contact_user_id UUID REFERENCES auth.users,
  name_hint TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  is_blocked BOOLEAN DEFAULT FALSE,
  UNIQUE (owner, contact_phone)
);

CREATE INDEX idx_contacts_owner ON contacts(owner);
CREATE INDEX idx_contacts_phone ON contacts(contact_phone);

-- conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN DEFAULT FALSE,
  title TEXT,
  avatar_url TEXT,
  description TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  disappearing_seconds INTEGER DEFAULT NULL,
  invite_link TEXT UNIQUE,
  invite_link_expires_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_invite_link ON conversations(invite_link);

-- conversation_members table
CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  is_admin BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  muted_until TIMESTAMPTZ,
  pin_order INTEGER,
  last_read_message_id UUID,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_conversation_members_user_id ON conversation_members(user_id);
CREATE INDEX idx_conversation_members_pin_order ON conversation_members(pin_order) WHERE pin_order IS NOT NULL;

-- messages table: store content encrypted (ciphertext) if E2EE
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users,
  ciphertext BYTEA, -- encrypted payload
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'voice', 'file', 'system')),
  media_path TEXT, -- storage path when media stored on Supabase
  media_metadata JSONB, -- file size, dimensions, duration, etc.
  metadata JSONB DEFAULT '{}'::JSONB, -- edited, ephemeral_expires_at, etc.
  reply_to UUID REFERENCES messages(id),
  forwarded_from UUID REFERENCES messages(id),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ -- for disappearing messages
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_reply_to ON messages(reply_to);
CREATE INDEX idx_messages_expires_at ON messages(expires_at) WHERE expires_at IS NOT NULL;

-- message_reactions table
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  reaction TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (message_id, user_id, reaction)
);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);

-- message_receipts table (for delivery and read receipts)
CREATE TABLE message_receipts (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  status TEXT CHECK (status IN ('delivered', 'read')),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (message_id, user_id, status)
);

CREATE INDEX idx_message_receipts_message_id ON message_receipts(message_id);

-- typing_status table
CREATE TABLE typing_status (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  is_typing BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- presence table
CREATE TABLE presence (
  user_id UUID REFERENCES auth.users PRIMARY KEY,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  device_type TEXT CHECK (device_type IN ('phone', 'desktop', 'web'))
);

-- devices table for storing public device keys, push tokens, last_active
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  device_name TEXT,
  device_type TEXT CHECK (device_type IN ('phone', 'desktop', 'web')),
  public_identity_key TEXT, -- base64 encoded
  public_prekeys JSONB, -- prekeys required for Signal
  signed_prekey JSONB, -- signed prekey bundle
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  push_token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_push_token ON devices(push_token);

-- group_sender_keys table (encrypted on server per member)
CREATE TABLE group_sender_keys (
  group_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users,
  recipient_id UUID REFERENCES auth.users,
  encrypted_key_data BYTEA,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, sender_id, recipient_id)
);

-- call_signals table (WebRTC signaling)
CREATE TABLE call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  from_user UUID REFERENCES auth.users,
  to_user UUID REFERENCES auth.users,
  call_id UUID,
  type TEXT CHECK (type IN ('offer', 'answer', 'ice', 'hangup', 'ringing', 'accept', 'decline')),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_signals_conversation_id ON call_signals(conversation_id);
CREATE INDEX idx_call_signals_call_id ON call_signals(call_id);

-- call_history table
CREATE TABLE call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES auth.users,
  call_type TEXT CHECK (call_type IN ('voice', 'video')),
  status TEXT CHECK (status IN ('completed', 'missed', 'declined', 'failed')),
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_call_history_conversation_id ON call_history(conversation_id);

-- statuses table (stories)
CREATE TABLE statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  media_path TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video', 'text')),
  caption TEXT,
  background_color TEXT,
  font_style TEXT,
  privacy_settings JSONB DEFAULT '{"viewers": "everyone"}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_statuses_user_id ON statuses(user_id);
CREATE INDEX idx_statuses_expires_at ON statuses(expires_at);

-- status_views table (who viewed which status)
CREATE TABLE status_views (
  status_id UUID REFERENCES statuses(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (status_id, viewer_id)
);

-- blocked_users table
CREATE TABLE blocked_users (
  blocker_id UUID REFERENCES auth.users,
  blocked_id UUID REFERENCES auth.users,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- reported_content table (for moderation)
CREATE TABLE reported_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users,
  reported_user_id UUID REFERENCES auth.users,
  content_type TEXT CHECK (content_type IN ('message', 'status', 'profile')),
  content_id UUID,
  reason TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users
);

-- invite_links table (for group invites)
CREATE TABLE invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users,
  token TEXT UNIQUE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invite_links_token ON invite_links(token);
CREATE INDEX idx_invite_links_conversation_id ON invite_links(conversation_id);

-- Functions and triggers

-- Function to update last_message_at in conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET last_message_at = NEW.created_at 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating last_message_at
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to clean up expired statuses
CREATE OR REPLACE FUNCTION cleanup_expired_statuses()
RETURNS void AS $$
BEGIN
  DELETE FROM statuses WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired messages (disappearing messages)
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update presence on activity
CREATE OR REPLACE FUNCTION update_user_presence(user_uuid UUID, device_type_param TEXT DEFAULT 'web')
RETURNS void AS $$
BEGIN
  INSERT INTO presence (user_id, last_heartbeat, status, device_type)
  VALUES (user_uuid, NOW(), 'online', device_type_param)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_heartbeat = NOW(),
    status = 'online',
    device_type = device_type_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate secure invite tokens
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Views for common queries

-- View for conversation list with last message and unread count
CREATE VIEW conversation_list AS
SELECT 
  c.*,
  cm.user_id,
  cm.is_admin,
  cm.muted_until,
  cm.pin_order,
  cm.last_read_message_id,
  lm.id as last_message_id,
  lm.sender_id as last_message_sender_id,
  lm.content_type as last_message_type,
  lm.created_at as last_message_at,
  COALESCE(unread.count, 0) as unread_count,
  sender_profile.display_name as last_message_sender_name
FROM conversations c
JOIN conversation_members cm ON c.id = cm.conversation_id
LEFT JOIN messages lm ON c.id = lm.conversation_id 
  AND lm.created_at = c.last_message_at
LEFT JOIN profiles sender_profile ON lm.sender_id = sender_profile.id
LEFT JOIN (
  SELECT 
    m.conversation_id,
    COUNT(*) as count
  FROM messages m
  JOIN conversation_members cm2 ON m.conversation_id = cm2.conversation_id
  WHERE cm2.last_read_message_id IS NULL 
    OR m.created_at > (
      SELECT created_at FROM messages 
      WHERE id = cm2.last_read_message_id
    )
  GROUP BY m.conversation_id
) unread ON c.id = unread.conversation_id;

-- View for active statuses (not expired)
CREATE VIEW active_statuses AS
SELECT s.*, p.display_name, p.avatar_url as user_avatar
FROM statuses s
JOIN profiles p ON s.user_id = p.id
WHERE s.expires_at > NOW()
ORDER BY s.created_at DESC;

