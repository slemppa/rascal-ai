import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUserProfile = useCallback(async (sessionUser) => {
    
    // Käytä suoraan session useria features-tiedoilla - ei users-taulun hakua
    const userWithFeatures = {
      ...sessionUser,
      features: ['Social Media', 'Phone Calls', 'Email marketing integration', 'Marketing assistant']
    }
    
    return userWithFeatures
  }, [])

  useEffect(() => {
    // Tarkistetaan localStorage nähdäksemme onko session-tietoja
    const sessionKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.includes('auth-token'))
    
    if (sessionKey) {
      try {
        const sessionData = JSON.parse(localStorage.getItem(sessionKey))
        
        if (sessionData?.user) {
          const userWithProfile = {
            ...sessionData.user,
            features: ['Social Media', 'Phone Calls', 'Email marketing integration', 'Marketing assistant']
          }
          setUser(userWithProfile)
        }
      } catch (error) {
        console.error('Error parsing localStorage session:', error)
      }
    }
    
    // onAuthStateChange listener - dokumentaation mukainen toteutus
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          // Tyhjennetään storage dokumentaation mukaisesti
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key)
            }
          })
          setUser(null)
          setLoading(false)
          
          // Hae logout-syy sessionStoragesta
          const logoutReason = sessionStorage.getItem('logoutReason')
          sessionStorage.removeItem('logoutReason') // Tyhjennä heti
          
          // Ohjaus landingpageen logout-syyllä
          navigate('/', { 
            state: { 
              logoutReason: logoutReason || 'Sessio päättyi',
              showLogoutMessage: true 
            } 
          })
        } else if (session?.user) {
          const userWithProfile = await fetchUserProfile(session.user)
          setUser(userWithProfile)
        } else {
          setUser(null)
        }
        
        if (event !== 'SIGNED_OUT') {
          setLoading(false)
        }
      }
    )

    setLoading(false)

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserProfile, navigate])

  const signOut = async () => {
    try {
      // Aseta logout-syy sessionStorage:en
      sessionStorage.setItem('logoutReason', 'Käyttäjä kirjautui ulos')
      
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error('Error signing out:', error.message)
        // Jos Supabase logout epäonnistuu, tyhjennetään silti local state
        setUser(null)
        navigate('/', { 
          state: { 
            logoutReason: 'Virhe kirjautumisessa ulos',
            showLogoutMessage: true 
          } 
        })
      }
    } catch (err) {
      console.error('SignOut error:', err)
      // Jos tapahtuu poikkeus, tyhjennetään silti local state
      setUser(null)
      navigate('/', { 
        state: { 
          logoutReason: 'Virhe kirjautumisessa ulos',
          showLogoutMessage: true 
        } 
      })
    }
  }

  const value = {
    user: user,
    loading: loading,
    signOut: signOut,
    fetchUserProfile: fetchUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}