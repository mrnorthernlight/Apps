// Supabase Database Types
// Generated from ClassConnect database schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'student' | 'teacher' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'student' | 'teacher' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'student' | 'teacher' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          description: string | null
          teacher_id: string
          class_code: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          teacher_id: string
          class_code: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          teacher_id?: string
          class_code?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      class_members: {
        Row: {
          id: string
          user_id: string
          class_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          user_id: string
          class_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          class_id?: string
          joined_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          class_id: string
          name: string
          description: string | null
          type: 'text' | 'voice' | 'video'
          is_private: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          name: string
          description?: string | null
          type?: 'text' | 'voice' | 'video'
          is_private?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          name?: string
          description?: string | null
          type?: 'text' | 'voice' | 'video'
          is_private?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      dm_chats: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          channel_id: string | null
          dm_chat_id: string | null
          content: string | null
          media_url: string | null
          media_type: string | null
          parent_message_id: string | null
          is_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          channel_id?: string | null
          dm_chat_id?: string | null
          content?: string | null
          media_url?: string | null
          media_type?: string | null
          parent_message_id?: string | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          channel_id?: string | null
          dm_chat_id?: string | null
          content?: string | null
          media_url?: string | null
          media_type?: string | null
          parent_message_id?: string | null
          is_edited?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          class_id: string
          title: string
          description: string | null
          instructions: string | null
          due_date: string | null
          points_possible: number
          status: 'draft' | 'published' | 'closed'
          file_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          title: string
          description?: string | null
          instructions?: string | null
          due_date?: string | null
          points_possible?: number
          status?: 'draft' | 'published' | 'closed'
          file_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          title?: string
          description?: string | null
          instructions?: string | null
          due_date?: string | null
          points_possible?: number
          status?: 'draft' | 'published' | 'closed'
          file_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          content: string | null
          file_url: string | null
          status: 'draft' | 'submitted' | 'graded'
          points_earned: number | null
          feedback: string | null
          graded_by: string | null
          submitted_at: string | null
          graded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          content?: string | null
          file_url?: string | null
          status?: 'draft' | 'submitted' | 'graded'
          points_earned?: number | null
          feedback?: string | null
          graded_by?: string | null
          submitted_at?: string | null
          graded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          content?: string | null
          file_url?: string | null
          status?: 'draft' | 'submitted' | 'graded'
          points_earned?: number | null
          feedback?: string | null
          graded_by?: string | null
          submitted_at?: string | null
          graded_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          uploader_id: string
          class_id: string | null
          channel_id: string | null
          assignment_id: string | null
          filename: string
          file_size: number | null
          file_type: string | null
          file_url: string
          is_public: boolean
          uploaded_at: string
        }
        Insert: {
          id?: string
          uploader_id: string
          class_id?: string | null
          channel_id?: string | null
          assignment_id?: string | null
          filename: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          is_public?: boolean
          uploaded_at?: string
        }
        Update: {
          id?: string
          uploader_id?: string
          class_id?: string | null
          channel_id?: string | null
          assignment_id?: string | null
          filename?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          is_public?: boolean
          uploaded_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          host_id: string
          channel_id: string | null
          dm_chat_id: string | null
          title: string | null
          type: 'voice' | 'video'
          is_recording: boolean
          recording_url: string | null
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          host_id: string
          channel_id?: string | null
          dm_chat_id?: string | null
          title?: string | null
          type?: 'voice' | 'video'
          is_recording?: boolean
          recording_url?: string | null
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          host_id?: string
          channel_id?: string | null
          dm_chat_id?: string | null
          title?: string | null
          type?: 'voice' | 'video'
          is_recording?: boolean
          recording_url?: string | null
          started_at?: string
          ended_at?: string | null
        }
      }
      call_participants: {
        Row: {
          id: string
          call_id: string
          user_id: string
          joined_at: string
          left_at: string | null
        }
        Insert: {
          id?: string
          call_id: string
          user_id: string
          joined_at?: string
          left_at?: string | null
        }
        Update: {
          id?: string
          call_id?: string
          user_id?: string
          joined_at?: string
          left_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          related_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'teacher' | 'admin'
      channel_type: 'text' | 'voice' | 'video'
      call_type: 'voice' | 'video'
      assignment_status: 'draft' | 'published' | 'closed'
      submission_status: 'draft' | 'submitted' | 'graded'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

