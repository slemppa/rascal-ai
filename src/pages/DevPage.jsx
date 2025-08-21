import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import DevChatPage from './DevChatPage'

export default function DevPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('auth_user_id', user.id)
          .single()

        if (error) {
          setIsAdmin(false)
        } else {
          setIsAdmin(userData?.role === 'admin' || userData?.company_id === 1)
        }
      } catch (_err) {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  if (loading) {
    return <div className="ai-chat-loading">Ladataan...</div>
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-access-denied">
          <h2>Pääsy estetty</h2>
          <p>Dev-sivu on näkyvissä vain ylläpidolle.</p>
        </div>
      </div>
    )
  }

  return <DevChatPage />
}


