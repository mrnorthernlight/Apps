-- Row Level Security (RLS) Policies for ClassConnect
-- Ensures users can only access data they're authorized to see

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is teacher of a class
CREATE OR REPLACE FUNCTION is_class_teacher(user_id UUID, class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM classes 
        WHERE id = class_id AND teacher_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is member of a class
CREATE OR REPLACE FUNCTION is_class_member(user_id UUID, class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM class_members 
        WHERE user_id = user_id AND class_id = class_id
    ) OR is_class_teacher(user_id, class_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user can access channel
CREATE OR REPLACE FUNCTION can_access_channel(user_id UUID, channel_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    channel_class_id UUID;
BEGIN
    SELECT class_id INTO channel_class_id FROM channels WHERE id = channel_id;
    RETURN is_class_member(user_id, channel_class_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- USERS table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all users" ON users
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Users can view classmates and teachers" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM class_members cm1
            JOIN class_members cm2 ON cm1.class_id = cm2.class_id
            WHERE cm1.user_id = auth.uid() AND cm2.user_id = users.id
        ) OR
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.teacher_id = users.id AND is_class_member(auth.uid(), c.id)
        ) OR
        EXISTS (
            SELECT 1 FROM classes c
            WHERE c.teacher_id = auth.uid() AND is_class_member(users.id, c.id)
        )
    );

-- CLASSES table policies
CREATE POLICY "Teachers can create classes" ON classes
    FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can view and update their classes" ON classes
    FOR ALL USING (teacher_id = auth.uid());

CREATE POLICY "Students can view classes they're enrolled in" ON classes
    FOR SELECT USING (is_class_member(auth.uid(), id));

CREATE POLICY "Admins can manage all classes" ON classes
    FOR ALL USING (is_admin(auth.uid()));

-- CLASS_MEMBERS table policies
CREATE POLICY "Teachers can manage their class members" ON class_members
    FOR ALL USING (is_class_teacher(auth.uid(), class_id));

CREATE POLICY "Students can view class members of their classes" ON class_members
    FOR SELECT USING (is_class_member(auth.uid(), class_id));

CREATE POLICY "Students can leave classes" ON class_members
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all class members" ON class_members
    FOR ALL USING (is_admin(auth.uid()));

-- CHANNELS table policies
CREATE POLICY "Class members can view channels" ON channels
    FOR SELECT USING (is_class_member(auth.uid(), class_id));

CREATE POLICY "Teachers can manage channels in their classes" ON channels
    FOR ALL USING (is_class_teacher(auth.uid(), class_id));

CREATE POLICY "Admins can manage all channels" ON channels
    FOR ALL USING (is_admin(auth.uid()));

-- DM_CHATS table policies
CREATE POLICY "Users can view their own DM chats" ON dm_chats
    FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create DM chats" ON dm_chats
    FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- MESSAGES table policies
CREATE POLICY "Users can view messages in accessible channels" ON messages
    FOR SELECT USING (
        (channel_id IS NOT NULL AND can_access_channel(auth.uid(), channel_id)) OR
        (dm_chat_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM dm_chats 
            WHERE id = dm_chat_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
        ))
    );

CREATE POLICY "Users can send messages to accessible channels/DMs" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND (
            (channel_id IS NOT NULL AND can_access_channel(auth.uid(), channel_id)) OR
            (dm_chat_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM dm_chats 
                WHERE id = dm_chat_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
            ))
        )
    );

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
    FOR DELETE USING (sender_id = auth.uid());

-- ASSIGNMENTS table policies
CREATE POLICY "Teachers can manage assignments in their classes" ON assignments
    FOR ALL USING (is_class_teacher(auth.uid(), class_id));

CREATE POLICY "Students can view published assignments in their classes" ON assignments
    FOR SELECT USING (
        is_class_member(auth.uid(), class_id) AND status = 'published'
    );

CREATE POLICY "Admins can manage all assignments" ON assignments
    FOR ALL USING (is_admin(auth.uid()));

-- SUBMISSIONS table policies
CREATE POLICY "Students can manage their own submissions" ON submissions
    FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their assignments" ON submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.id = assignment_id AND is_class_teacher(auth.uid(), a.class_id)
        )
    );

CREATE POLICY "Teachers can grade submissions for their assignments" ON submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM assignments a 
            WHERE a.id = assignment_id AND is_class_teacher(auth.uid(), a.class_id)
        )
    );

CREATE POLICY "Admins can manage all submissions" ON submissions
    FOR ALL USING (is_admin(auth.uid()));

-- FILES table policies
CREATE POLICY "Users can view their own files" ON files
    FOR SELECT USING (uploader_id = auth.uid());

CREATE POLICY "Users can view public files in accessible classes" ON files
    FOR SELECT USING (
        is_public = true AND (
            class_id IS NULL OR is_class_member(auth.uid(), class_id)
        )
    );

CREATE POLICY "Users can upload files" ON files
    FOR INSERT WITH CHECK (uploader_id = auth.uid());

CREATE POLICY "Users can manage their own files" ON files
    FOR ALL USING (uploader_id = auth.uid());

CREATE POLICY "Teachers can view files in their classes" ON files
    FOR SELECT USING (
        class_id IS NOT NULL AND is_class_teacher(auth.uid(), class_id)
    );

-- CALLS table policies
CREATE POLICY "Users can view calls they can access" ON calls
    FOR SELECT USING (
        host_id = auth.uid() OR
        (channel_id IS NOT NULL AND can_access_channel(auth.uid(), channel_id)) OR
        (dm_chat_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM dm_chats 
            WHERE id = dm_chat_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
        ))
    );

CREATE POLICY "Users can create calls in accessible channels/DMs" ON calls
    FOR INSERT WITH CHECK (
        host_id = auth.uid() AND (
            (channel_id IS NOT NULL AND can_access_channel(auth.uid(), channel_id)) OR
            (dm_chat_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM dm_chats 
                WHERE id = dm_chat_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
            ))
        )
    );

CREATE POLICY "Call hosts can manage their calls" ON calls
    FOR ALL USING (host_id = auth.uid());

-- CALL_PARTICIPANTS table policies
CREATE POLICY "Users can view participants of calls they can access" ON call_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM calls c 
            WHERE c.id = call_id AND (
                c.host_id = auth.uid() OR
                (c.channel_id IS NOT NULL AND can_access_channel(auth.uid(), c.channel_id)) OR
                (c.dm_chat_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM dm_chats 
                    WHERE id = c.dm_chat_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
                ))
            )
        )
    );

CREATE POLICY "Users can join calls they can access" ON call_participants
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM calls c 
            WHERE c.id = call_id AND (
                (c.channel_id IS NOT NULL AND can_access_channel(auth.uid(), c.channel_id)) OR
                (c.dm_chat_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM dm_chats 
                    WHERE id = c.dm_chat_id AND (user1_id = auth.uid() OR user2_id = auth.uid())
                ))
            )
        )
    );

CREATE POLICY "Users can leave calls" ON call_participants
    FOR UPDATE USING (user_id = auth.uid());

-- NOTIFICATIONS table policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- This will be restricted by application logic
