import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showVersionNotification, setShowVersionNotification] = useState(false)

  // Tarkista onko uusi versio - näytä aina jos versio on eri kuin edellinen
  const checkVersionUpdate = useCallback(() => {
    const currentVersion = import.meta.env.REACT_APP_VERSION || '1.56.0'
    const lastSeenVersion = localStorage.getItem('lastSeenVersion')
    
    // Näytä aina jos versio on eri kuin viimeksi nähty
    if (lastSeenVersion !== currentVersion) {
      setShowVersionNotification(true)
    }
  }, [])

  // Merkitse versio nähdyksi
  const markVersionAsSeen = useCallback(() => {
    const currentVersion = import.meta.env.REACT_APP_VERSION || '1.56.0'
    localStorage.setItem('lastSeenVersion', currentVersion)
    setShowVersionNotification(false)
  }, [])

  // Hae notifikaatiot suoraan Supabasesta
  const fetchNotifications = useCallback(async (limit = 50, offset = 0) => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(session.user.id)
      if (!orgId) {
        throw new Error('Organisaation ID ei löytynyt')
      }

      // Hae notifikaatiot suoraan Supabasesta
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (notificationsError) {
        throw notificationsError
      }

      // Hae lukemattomien määrä
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .eq('is_read', false)
        .eq('is_deleted', false)

      if (countError) {
        console.error('Error counting unread notifications:', countError)
      }

      setNotifications(notifications || [])
      setUnreadCount(unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [user]) // Käyttää user dependencyä

  // Merkitse notifikaatio luetuksi
  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(session.user.id)
      if (!orgId) {
        throw new Error('Organisaation ID ei löytynyt')
      }

      // Päivitä notifikaatio suoraan Supabasessa
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId)
        .eq('user_id', orgId) // Käytetään organisaation ID:tä

      if (error) {
        throw error
      }

      // Päivitä paikallinen tila
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      setError(error.message)
    }
  }, [user]) // Käyttää user dependencyä

  // Merkitse kaikki luetuksi
  const markAllAsRead = useCallback(async () => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(session.user.id)
      if (!orgId) {
        throw new Error('Organisaation ID ei löytynyt')
      }

      // Merkitse kaikki lukemattomat luetuksi suoraan Supabasessa
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .eq('is_read', false)
        .eq('is_deleted', false)

      if (error) {
        throw error
      }

      // Päivitä paikallinen tila
      setNotifications(prev => 
        prev.map(notification => 
          !notification.is_read 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      setError(error.message)
    }
  }, [user]) // Käyttää user dependencyä

  // Poista notifikaatio
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session found')
      }

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(session.user.id)
      if (!orgId) {
        throw new Error('Organisaation ID ei löytynyt')
      }

      // Poista notifikaatio suoraan Supabasesta
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', orgId) // Käytetään organisaation ID:tä

      if (error) {
        throw error
      }

      // Päivitä paikallinen tila
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
      setError(error.message)
    }
  }, [user, notifications]) // Käyttää user ja notifications dependencyä

  // Hae vain unread count (ei kaikkia notifikaatioita)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      // Hae organisaation ID (public.users.id)
      const orgId = await getUserOrgId(session.user.id)
      if (!orgId) return

      // Hae vain lukemattomien määrä
      const { count: unreadCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .eq('is_read', false)
        .eq('is_deleted', false)

      if (countError) {
        console.error('Error counting unread notifications:', countError)
        return
      }

      setUnreadCount(unreadCount || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [user]) // Käyttää user dependencyä

  // Hae unread count kun käyttäjä kirjautuu sisään
  useEffect(() => {
    if (user) {
      fetchUnreadCount()
      checkVersionUpdate()
    }
  }, [user, fetchUnreadCount, checkVersionUpdate])

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    showVersionNotification,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markVersionAsSeen,
    refresh: () => fetchNotifications()
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
