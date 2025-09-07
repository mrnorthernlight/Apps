// Supabase Database Types
// This file will be generated from Supabase CLI or manually defined

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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          teacher_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          teacher_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      class_members: {
        Row: {
          user_id: string
          class_id: string
          joined_at: string
        }
        Insert: {
          user_id: string
          class_id: string
          joined_at?: string
        }
        Update: {
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
          type: 'text' | 'voice' | 'video'
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          name: string
          type: 'text' | 'voice' | 'video'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          name?: string
          type?: 'text' | 'voice' | 'video'
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string | null
          dm_chat_id: string | null
          sender_id: string
          content: string
          media_url: string | null
          parent_message_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          channel_id?: string | null
          dm_chat_id?: string | null
          sender_id: string
          content: string
          media_url?: string | null
          parent_message_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string | null
          dm_chat_id?: string | null
          sender_id?: string
          content?: string
          media_url?: string | null
          parent_message_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          class_id: string
          title: string
          description: string
          due_date: string
          file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          class_id: string
          title: string
          description: string
          due_date: string
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          class_id?: string
          title?: string
          description?: string
          due_date?: string
          file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          assignment_id: string
          student_id: string
          file_url: string | null
          content: string | null
          submitted_at: string
          grade: number | null
          feedback: string | null
          graded_at: string | null
        }
        Insert: {
          id?: string
          assignment_id: string
          student_id: string
          file_url?: string | null
          content?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
        }
        Update: {
          id?: string
          assignment_id?: string
          student_id?: string
          file_url?: string | null
          content?: string | null
          submitted_at?: string
          grade?: number | null
          feedback?: string | null
          graded_at?: string | null
        }
      }
      files: {
        Row: {
          id: string
          uploader_id: string
          class_id: string | null
          channel_id: string | null
          file_name: string
          file_type: string
          file_url: string
          file_size: number
          uploaded_at: string
        }
        Insert: {
          id?: string
          uploader_id: string
          class_id?: string | null
          channel_id?: string | null
          file_name: string
          file_type: string
          file_url: string
          file_size: number
          uploaded_at?: string
        }
        Update: {
          id?: string
          uploader_id?: string
          class_id?: string | null
          channel_id?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          file_size?: number
          uploaded_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          chat_type: '1:1' | 'group'
          channel_id: string | null
          dm_chat_id: string | null
          host_id: string
          type: 'voice' | 'video'
          started_at: string
          ended_at: string | null
          recording_url: string | null
        }
        Insert: {
          id?: string
          chat_type: '1:1' | 'group'
          channel_id?: string | null
          dm_chat_id?: string | null
          host_id: string
          type: 'voice' | 'video'
          started_at?: string
          ended_at?: string | null
          recording_url?: string | null
        }
        Update: {
          id?: string
          chat_type?: '1:1' | 'group'
          channel_id?: string | null
          dm_chat_id?: string | null
          host_id?: string
          type?: 'voice' | 'video'
          started_at?: string
          ended_at?: string | null
          recording_url?: string | null
        }
      }
      dm_chats: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          created_at?: string
          updated_at?: string
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
      chat_type: '1:1' | 'group'
    }
  }
}
