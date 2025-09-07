import { useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'

export const useRealtime = (table, callback, filter = null) => {
  const subscriptionRef = useRef(null)

  useEffect(() => {
    let channel = supabase.channel(`realtime-${table}`)

    if (filter) {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter
        },
        callback
      )
    } else {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        callback
      )
    }

    subscriptionRef.current = channel.subscribe()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [table, callback, filter])

  return subscriptionRef.current
}

export const useBroadcast = (channel, event, callback) => {
  const subscriptionRef = useRef(null)

  useEffect(() => {
    const channelInstance = supabase
      .channel(channel)
      .on('broadcast', { event }, callback)
      .subscribe()

    subscriptionRef.current = channelInstance

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [channel, event, callback])

  const broadcast = (payload) => {
    if (subscriptionRef.current) {
      return subscriptionRef.current.send({
        type: 'broadcast',
        event,
        payload
      })
    }
  }

  return { broadcast }
}

