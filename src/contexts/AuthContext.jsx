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
    if (!sessionUser) {
      console.error('fetchUserProfile called without sessionUser')
      return null
    }

    const defaultFeatures = DEFAULT_FEATURES
    
    // 1. Palautetaan HETI perustiedot, jotta UI ei jumiudu
    // Oletetaan aluksi, että rooli on 'user' kunnes taustahaku valmistuu
    const basicUser = {
      ...sessionUser,
      systemRole: 'user', 
      organizationRole: null,
      organizationId: null,
      company_id: null,
      features: defaultFeatures
    }

    // 2. Käynnistetään taustahaku, joka hakee tarkat roolit ja päivittää tilan
    const loadFullProfile = async () => {
      try {
        let systemRole = 'user'
        let company_id = null
        let orgData = null
        let orgRole = null
        let orgId = null
        let features = defaultFeatures

        // A) Hae Järjestelmärooli (users-taulu)
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', sessionUser.id)
          .maybeSingle()
        
        if (userData) {
          systemRole = userData.role || 'user' // 'admin', 'moderator', 'user'
          company_id = userData.company_id || null
          features = Array.isArray(userData.features) ? userData.features : defaultFeatures
          
          // Jos käyttäjä on system admin/moderator, asetetaan se myös organisaatioksi (legacy-tuki)
          if (userData.role === 'admin' || userData.role === 'moderator') {
            orgId = userData.id
            orgRole = userData.role
            orgData = userData
          }
        }

        // B) Hae Organisaatiorooli (org_members-taulu)
        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('auth_user_id', sessionUser.id)
          .maybeSingle()

        if (orgMember) {
          // Käyttäjä on organisaation jäsen
          const { data: org } = await supabase
            .from('users')
            .select('*')
            .eq('id', orgMember.org_id)
            .single()
          
          if (org) {
            orgId = orgMember.org_id
            orgRole = orgMember.role // Esim. 'admin' organisaation sisällä
            orgData = org
            // Organisaation featuret yliajavat omat, paitsi jos olet järjestelmäadmin
            if (systemRole !== 'admin' && systemRole !== 'moderator') {
              features = Array.isArray(org.features) ? org.features : defaultFeatures
            }
          }
        }

        // Päivitä tila lopullisilla tiedoilla
        setOrganization(orgData ? {
          id: orgId,
          role: orgRole,
          data: orgData
        } : null)

        setUser(prev => ({
          ...sessionUser, // Varmistetaan että session-tiedot pysyvät
          systemRole: systemRole, // Järjestelmärooli (users.role)
          organizationRole: orgRole, // Organisaatiorooli (org_members.role)
          organizationId: orgId,
          company_id: company_id,
          features: features
        }))

        console.log('[AuthContext] Full profile loaded:', {
          email: sessionUser.email,
          systemRole,
          organizationRole: orgRole,
          company_id
        })

      } catch (error) {
        console.error('Error in background profile fetch:', error)
      }
    }

    // Käynnistä taustahaku (älä odota tätä awaitilla!)
    loadFullProfile()
    
    // Palauta perustiedot heti
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
        console.log('[AuthContext] Auth state change:', event, session?.user?.email)
        
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
          // Tarkista onko tämä SIGNED_IN event (uusi kirjautuminen)
          const isSignIn = event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED'
          
          try {
            setLoading(true)
            
            // Timeout varmuuden vuoksi (10 sekuntia)
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('fetchUserProfile timeout')), 10000)
            )
            
            const userWithProfile = await Promise.race([
              fetchUserProfile(session.user),
              timeoutPromise
            ])
            
            // Varmista että käyttäjä asetettiin
            if (userWithProfile) {
              setUser(userWithProfile)
              console.log('[AuthContext] User profile loaded:', userWithProfile.email, 'systemRole:', userWithProfile.systemRole)
            } else {
              console.error('fetchUserProfile returned null, setting basic user')
              // Aseta peruskäyttäjä varmuuden vuoksi
              setUser({
                ...session.user,
                systemRole: 'user',
                features: DEFAULT_FEATURES,
                organizationId: null,
                organizationRole: null
              })
            }
          } catch (error) {
            console.error('Error in fetchUserProfile:', error)
            // Aseta peruskäyttäjä virheen sattuessa
            setUser({
              ...session.user,
              systemRole: 'user',
              features: DEFAULT_FEATURES,
              organizationId: null,
              organizationRole: null
            })
          } finally {
            setLoading(false)
          }
        } else {
          // Ei sessiota
          setUser(null)
          setOrganization(null)
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