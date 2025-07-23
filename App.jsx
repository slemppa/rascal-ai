import { useState, useEffect } from 'react'
import supabase from './utils/supabase'
import LoginPage from './src/pages/LoginPage'
import DashboardPage from './src/pages/DashboardPage'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Hae session Supabaselta
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }
    getSession()
    // Kuuntele kirjautumisen muutoksia
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => {
      listener?.unsubscribe()
    }
  }, [])

  if (loading) return null
  if (!session) {
    return <LoginPage onLogin={(sess) => setSession(sess)} />
  }
  return <DashboardPage />
} 