import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

// Type aliases for easier use
type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Class = Tables['classes']['Row']
type ClassMember = Tables['class_members']['Row']
type Channel = Tables['channels']['Row']
type Message = Tables['messages']['Row']
type Assignment = Tables['assignments']['Row']
type Submission = Tables['submissions']['Row']

// User operations
export const userService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    return { data, error }
  },

  async getUsersByRole(role: 'student' | 'teacher' | 'admin') {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
    
    return { data, error }
  }
}

// Class operations
export const classService = {
  async createClass(classData: Tables['classes']['Insert']) {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single()
    
    return { data, error }
  },

  async getClassesByTeacher(teacherId: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
    
    return { data, error }
  },

  async getClassesByStudent(studentId: string) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_members!inner(user_id)
      `)
      .eq('class_members.user_id', studentId)
      .eq('is_active', true)
    
    return { data, error }
  },

  async getClassByCode(classCode: string) {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('class_code', classCode)
      .eq('is_active', true)
      .single()
    
    return { data, error }
  },

  async joinClass(userId: string, classId: string) {
    const { data, error } = await supabase
      .from('class_members')
      .insert({
        user_id: userId,
        class_id: classId
      })
      .select()
      .single()
    
    return { data, error }
  },

  async getClassMembers(classId: string) {
    const { data, error } = await supabase
      .from('class_members')
      .select(`
        *,
        users(id, name, email, role, avatar_url)
      `)
      .eq('class_id', classId)
    
    return { data, error }
  }
}

// Channel operations
export const channelService = {
  async createChannel(channelData: Tables['channels']['Insert']) {
    const { data, error } = await supabase
      .from('channels')
      .insert(channelData)
      .select()
      .single()
    
    return { data, error }
  },

  async getChannelsByClass(classId: string) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: true })
    
    return { data, error }
  },

  async getChannelById(channelId: string) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single()
    
    return { data, error }
  }
}

// Message operations
export const messageService = {
  async sendMessage(messageData: Tables['messages']['Insert']) {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        users(id, name, avatar_url)
      `)
      .single()
    
    return { data, error }
  },

  async getChannelMessages(channelId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users(id, name, avatar_url)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  async getDMMessages(dmChatId: string, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users(id, name, avatar_url)
      `)
      .eq('dm_chat_id', dmChatId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  async updateMessage(messageId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        content, 
        is_edited: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single()
    
    return { data, error }
  },

  async deleteMessage(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
    
    return { data, error }
  }
}

// Assignment operations
export const assignmentService = {
  async createAssignment(assignmentData: Tables['assignments']['Insert']) {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single()
    
    return { data, error }
  },

  async getAssignmentsByClass(classId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('class_id', classId)
      .order('due_date', { ascending: true })
    
    return { data, error }
  },

  async getAssignmentById(assignmentId: string) {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single()
    
    return { data, error }
  },

  async updateAssignment(assignmentId: string, updates: Tables['assignments']['Update']) {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', assignmentId)
      .select()
      .single()
    
    return { data, error }
  }
}

// Submission operations
export const submissionService = {
  async createSubmission(submissionData: Tables['submissions']['Insert']) {
    const { data, error } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single()
    
    return { data, error }
  },

  async getSubmissionsByAssignment(assignmentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        users(id, name, email)
      `)
      .eq('assignment_id', assignmentId)
    
    return { data, error }
  },

  async getSubmissionByStudent(assignmentId: string, studentId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single()
    
    return { data, error }
  },

  async updateSubmission(submissionId: string, updates: Tables['submissions']['Update']) {
    const { data, error } = await supabase
      .from('submissions')
      .update(updates)
      .eq('id', submissionId)
      .select()
      .single()
    
    return { data, error }
  },

  async gradeSubmission(
    submissionId: string, 
    pointsEarned: number, 
    feedback: string, 
    gradedBy: string
  ) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        points_earned: pointsEarned,
        feedback,
        graded_by: gradedBy,
        status: 'graded',
        graded_at: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single()
    
    return { data, error }
  }
}

// Direct message operations
export const dmService = {
  async createOrGetDMChat(user1Id: string, user2Id: string) {
    // Ensure consistent ordering
    const [userId1, userId2] = [user1Id, user2Id].sort()
    
    // Try to get existing chat
    let { data, error } = await supabase
      .from('dm_chats')
      .select('*')
      .eq('user1_id', userId1)
      .eq('user2_id', userId2)
      .single()
    
    // If doesn't exist, create it
    if (error && error.code === 'PGRST116') {
      const { data: newChat, error: createError } = await supabase
        .from('dm_chats')
        .insert({
          user1_id: userId1,
          user2_id: userId2
        })
        .select()
        .single()
      
      return { data: newChat, error: createError }
    }
    
    return { data, error }
  },

  async getUserDMChats(userId: string) {
    const { data, error } = await supabase
      .from('dm_chats')
      .select(`
        *,
        user1:users!dm_chats_user1_id_fkey(id, name, avatar_url),
        user2:users!dm_chats_user2_id_fkey(id, name, avatar_url)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    
    return { data, error }
  }
}

// Notification operations
export const notificationService = {
  async createNotification(notificationData: Tables['notifications']['Insert']) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single()
    
    return { data, error }
  },

  async getUserNotifications(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  async markNotificationAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single()
    
    return { data, error }
  },

  async markAllNotificationsAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    return { data, error }
  }
}
