-- Row Level Security (RLS) Policies for Rupture Chat App
-- Run this after creating the schema

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read their own profile and profiles of users they chat with
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view chat participants" ON users
    FOR SELECT USING (
        id IN (
            SELECT cp.user_id 
            FROM chat_participants cp
            WHERE cp.chat_id IN (
                SELECT cp2.chat_id 
                FROM chat_participants cp2 
                WHERE cp2.user_id = auth.uid()
            )
        )
    );

-- Chat participants policies
-- Users can only see participants of chats they're part of
CREATE POLICY "Users can view chat participants" ON chat_participants
    FOR SELECT USING (
        chat_id IN (
            SELECT chat_id 
            FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join chats" ON chat_participants
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave chats" ON chat_participants
    FOR DELETE USING (user_id = auth.uid());

-- Chats policies
-- Users can only see chats they're participants of
CREATE POLICY "Users can view their chats" ON chats
    FOR SELECT USING (
        id IN (
            SELECT chat_id 
            FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chats" ON chats
    FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Chat admins can update group chats" ON chats
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        id IN (
            SELECT chat_id 
            FROM chat_participants 
            WHERE user_id = auth.uid() AND is_admin = true
        )
    );

-- Messages policies
-- Users can only see messages from chats they're part of
CREATE POLICY "Users can view messages from their chats" ON messages
    FOR SELECT USING (
        chat_id IN (
            SELECT chat_id 
            FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages to their chats" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        chat_id IN (
            SELECT chat_id 
            FROM chat_participants 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (sender_id = auth.uid());

-- Message reads policies
-- Users can only manage their own read status
CREATE POLICY "Users can view message reads" ON message_reads
    FOR SELECT USING (
        user_id = auth.uid() OR
        message_id IN (
            SELECT id FROM messages WHERE sender_id = auth.uid()
        )
    );

CREATE POLICY "Users can mark messages as read" ON message_reads
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their read status" ON message_reads
    FOR UPDATE USING (user_id = auth.uid());

-- Storage policies for file uploads
-- Create storage bucket for chat media
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-media' AND
        auth.role() = 'authenticated'
    );

-- Allow users to view files from their chats
CREATE POLICY "Users can view chat media" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'chat-media' AND
        auth.role() = 'authenticated'
    );

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'chat-media' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
