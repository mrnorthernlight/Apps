-- Seed data for Rupture Chat App (Optional - for testing)
-- Run this after schema.sql and policies.sql

-- Insert test users (passwords are hashed for 'password123')
INSERT INTO users (id, username, email, password_hash, profile_pic_url) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'alice_wonder',
    'alice@example.com',
    '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'bob_builder',
    'bob@example.com',
    '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'charlie_brown',
    'charlie@example.com',
    '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQ',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
);

-- Create a 1:1 chat between Alice and Bob
INSERT INTO chats (id, name, is_group, created_by) VALUES
(
    '660e8400-e29b-41d4-a716-446655440001',
    NULL,
    false,
    '550e8400-e29b-41d4-a716-446655440001'
);

-- Add participants to the 1:1 chat
INSERT INTO chat_participants (chat_id, user_id) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

-- Create a group chat
INSERT INTO chats (id, name, is_group, created_by) VALUES
(
    '660e8400-e29b-41d4-a716-446655440002',
    'Team Rupture',
    true,
    '550e8400-e29b-41d4-a716-446655440001'
);

-- Add participants to the group chat
INSERT INTO chat_participants (chat_id, user_id, is_admin) VALUES
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', true),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', false),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', false);

-- Insert some sample messages
INSERT INTO messages (chat_id, sender_id, content, message_type) VALUES
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Hey Bob! How are you doing?',
    'text'
),
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'Hi Alice! I''m doing great, thanks for asking. How about you?',
    'text'
),
(
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'I''m good too! Working on this new chat app called Rupture 🚀',
    'text'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    'Welcome to Team Rupture! 🎉',
    'text'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    'Thanks for adding me to the group!',
    'text'
),
(
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    'Excited to be part of this project! 💪',
    'text'
);

-- Mark some messages as read
INSERT INTO message_reads (message_id, user_id)
SELECT m.id, '550e8400-e29b-41d4-a716-446655440002'
FROM messages m
WHERE m.sender_id = '550e8400-e29b-41d4-a716-446655440001'
AND m.chat_id = '660e8400-e29b-41d4-a716-446655440001';

-- Update user online status
UPDATE users SET is_online = true WHERE id IN (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002'
);
