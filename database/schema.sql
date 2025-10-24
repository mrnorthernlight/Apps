-- Rupture Chat App Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_pic_url TEXT,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chats table (for both 1:1 and group chats)
CREATE TABLE chats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255), -- NULL for 1:1 chats, set for group chats
    is_group BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat participants (many-to-many relationship)
CREATE TABLE chat_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_admin BOOLEAN DEFAULT false, -- For group chat admins
    UNIQUE(chat_id, user_id)
);

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    media_type VARCHAR(50), -- 'image', 'file', etc.
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
    reply_to UUID REFERENCES messages(id) ON DELETE SET NULL,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message read status (for read receipts)
CREATE TABLE message_reads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get chat with last message
CREATE OR REPLACE FUNCTION get_user_chats(user_uuid UUID)
RETURNS TABLE (
    chat_id UUID,
    chat_name VARCHAR(255),
    is_group BOOLEAN,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    last_sender_username VARCHAR(50),
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as chat_id,
        CASE 
            WHEN c.is_group THEN c.name
            ELSE (
                SELECT u.username 
                FROM chat_participants cp2 
                JOIN users u ON cp2.user_id = u.id 
                WHERE cp2.chat_id = c.id AND cp2.user_id != user_uuid 
                LIMIT 1
            )
        END as chat_name,
        c.is_group,
        m.content as last_message,
        m.created_at as last_message_time,
        u.username as last_sender_username,
        (
            SELECT COUNT(*)
            FROM messages m2
            WHERE m2.chat_id = c.id 
            AND m2.sender_id != user_uuid
            AND m2.id NOT IN (
                SELECT mr.message_id 
                FROM message_reads mr 
                WHERE mr.user_id = user_uuid
            )
        ) as unread_count
    FROM chats c
    JOIN chat_participants cp ON c.id = cp.chat_id
    LEFT JOIN messages m ON c.id = m.chat_id
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE cp.user_id = user_uuid
    AND (m.id IS NULL OR m.created_at = (
        SELECT MAX(created_at) 
        FROM messages 
        WHERE chat_id = c.id
    ))
    ORDER BY COALESCE(m.created_at, c.created_at) DESC;
END;
$$ LANGUAGE plpgsql;
