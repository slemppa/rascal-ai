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
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUserProfile = useCallback(async (sessionUser) => {
    // Palautetaan heti käyttäjätiedot ilman organisaatiota, jotta kirjautuminen ei jää jumiin
    // Organisaatiotiedot haetaan myöhemmin taustalla
    const defaultFeatures = ['Social Media', 'Phone Calls', 'Email marketing integration', 'Marketing assistant']
    
    // Palautetaan heti perustiedot
    const basicUser = {
      ...sessionUser,
      features: defaultFeatures
    }

    // Yritetään hakea organisaatiotiedot taustalla (ei estä kirjautumista)
    try {
      const orgPromise = supabase
        .from('org_members')
        .select('org_id, role')
        .eq('auth_user_id', sessionUser.id)
        .maybeSingle()
        .then(async ({ data: orgMember, error: orgError }) => {
          if (!orgError && orgMember) {
            // Hae organisaation tiedot erikseen users-taulusta
            const { data: orgData, error: orgDataError } = await supabase
              .from('users')
              .select('*')
              .eq('id', orgMember.org_id)
              .single()
            
            // Aseta organisaatiotiedot kun ne löytyvät
            setOrganization({
              id: orgMember.org_id,
              role: orgMember.role,
              data: orgData || null
            })
            
            // Päivitä features jos löytyi
            const features = Array.isArray(orgData?.features) 
              ? orgData.features 
              : defaultFeatures
            
            setUser(prev => prev ? {
              ...prev,
              features: features,
              organizationId: orgMember.org_id,
              organizationRole: orgMember.role
            } : null)
          } else if (orgError) {
            // Jos org_members haussa virhe, yritetään hakea suoraan users-taulusta
            supabase
              .from('users')
              .select('*')
              .eq('auth_user_id', sessionUser.id)
              .maybeSingle()
              .then(({ data: userData, error: userError }) => {
                if (!userError && userData) {
                  const features = Array.isArray(userData.features) 
                    ? userData.features 
                    : defaultFeatures
                  
                  setUser(prev => prev ? {
                    ...prev,
                    features: features
                  } : null)
                }
              })
          }
        })
        .catch(err => {
          console.error('Error fetching organization (background):', err)
        })
      
      // Ei odoteta organisaatiotietoja - palautetaan heti
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
    
    return basicUser
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
          console.log('Users table updated:', payload)
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
    loading: loading,
    signOut: signOut,
    fetchUserProfile: fetchUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}