import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { DEFAULT_FEATURES } from '../constants/posts'

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
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingUserProfile, setLoadingUserProfile] = useState(false)
  const navigate = useNavigate()

  const fetchUserProfile = useCallback(async (sessionUser) => {
    const defaultFeatures = DEFAULT_FEATURES
    
    // 1. Hae AINA ensin käyttäjän oma profiili users-taulusta (Järjestelmärooli)
    let systemUser = null
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', sessionUser.id)
        .maybeSingle()
      
      if (!error && data) {
        systemUser = data
      }
    } catch (err) {
      console.error('Error fetching system user:', err)
    }

    // Alusta käyttäjäobjekti systemRole:lla
    let currentUser = {
      ...sessionUser,
      systemRole: systemUser?.role || 'user', // Tässä on aito "admin" jos users.role on admin
      company_id: systemUser?.company_id || null, // company_id tarvitaan admin-tarkistukseen
      features: systemUser?.features || defaultFeatures,
      organizationId: null,
      organizationRole: null
    }

    // Jos käyttäjä on system admin/moderator, asetetaan se myös organisaatioksi (vanha logiikka tuki tätä)
    if (systemUser && (systemUser.role === 'admin' || systemUser.role === 'moderator')) {
      setOrganization({
        id: systemUser.id,
        role: systemUser.role,
        data: systemUser
      })
      currentUser.organizationId = systemUser.id
      currentUser.organizationRole = systemUser.role
    }

    // 2. Hae organisaation jäsenyys rinnakkain (Organisaatiorooli)
    try {
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('auth_user_id', sessionUser.id)
        .maybeSingle()

      if (!orgError && orgMember) {
        // Jos löytyi organisaatio, haetaan sen tiedot
        const { data: orgData, error: orgDataError } = await supabase
          .from('users')
          .select('*')
          .eq('id', orgMember.org_id)
          .single()
        
        if (!orgDataError && orgData) {
          // Ylikirjoita features organisaation featureilla jos ei ole system admin
          // System admin pitää omat featurensa
          if (currentUser.systemRole !== 'admin' && currentUser.systemRole !== 'moderator') {
            currentUser.features = Array.isArray(orgData?.features) ? orgData.features : defaultFeatures
          }

          setOrganization({
            id: orgMember.org_id,
            role: orgMember.role, // Tämä on esim. "admin" organisaation sisällä
            data: orgData
          })
          
          currentUser.organizationId = orgMember.org_id
          currentUser.organizationRole = orgMember.role // Tämä on esim. "admin" organisaation sisällä
        }
      }
    } catch (error) {
      console.error('Error fetching organization:', error)
    }

    setUser(currentUser)
    return currentUser
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
            features: DEFAULT_FEATURES
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
          setOrganization(null)
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
          setOrganization(null)
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

  // Realtime subscription users-taulun muutoksille (features päivitykset)
  useEffect(() => {
    if (!organization?.id) return

    const channel = supabase
      .channel(`users:${organization.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${organization.id}`
        },
        (payload) => {
          // Päivitä features jos ne muuttuivat
          if (payload.new.features) {
            setUser(prev => prev ? {
              ...prev,
              features: Array.isArray(payload.new.features) ? payload.new.features : []
            } : null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organization?.id])

  const signOut = async () => {
    try {
      // Aseta logout-syy sessionStorage:en
      sessionStorage.setItem('logoutReason', 'Käyttäjä kirjautui ulos')
      
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error('Error signing out:', error.message)
        // Jos Supabase logout epäonnistuu, tyhjennetään silti local state
        setUser(null)
        setOrganization(null)
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
      setOrganization(null)
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
    organization: organization,
    loading: loading || loadingUserProfile,
    loadingUserProfile: loadingUserProfile,
    signOut: signOut,
    fetchUserProfile: fetchUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}