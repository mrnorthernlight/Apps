import { createSupabaseClient } from '@fambase/shared'
import type { SupabaseClient } from '@supabase/supabase-js'

export class DatabaseService {
  private supabase: SupabaseClient

  constructor(url: string, key: string) {
    this.supabase = createSupabaseClient(url, key)
  }

  // Profile operations
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Conversation operations
  async getConversations(userId: string) {
    const { data, error } = await this.supabase
      .from('conversation_list')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })

    if (error) throw error
    return data
  }

  async createConversation(data: any) {
    const { data: conversation, error } = await this.supabase
      .from('conversations')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return conversation
  }

  // Message operations
  async getMessages(conversationId: string, limit = 50, offset = 0) {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(id, display_name, avatar_url),
        reactions:message_reactions(*)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  async sendMessage(data: any) {
    const { data: message, error } = await this.supabase
      .from('messages')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return message
  }

  // Device operations
  async registerDevice(data: any) {
    const { data: device, error } = await this.supabase
      .from('devices')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return device
  }

  async getDeviceBundle(userId: string) {
    const { data, error } = await this.supabase
      .from('devices')
      .select('public_identity_key, public_prekeys, signed_prekey')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data
  }

  // Realtime subscriptions
  subscribeToConversation(conversationId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe()
  }

  subscribeToTyping(conversationId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`typing:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_status',
        filter: `conversation_id=eq.${conversationId}`
      }, callback)
      .subscribe()
  }

  subscribeToPresence(callback: (payload: any) => void) {
    return this.supabase
      .channel('presence')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'presence'
      }, callback)
      .subscribe()
  }
}

export * from '@fambase/shared'

