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
  const [profileLoaded, setProfileLoaded] = useState(false) // Uusi: seuraa onko profiili ladattu
  const navigate = useNavigate()

  const fetchUserProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      console.error('fetchUserProfile called without sessionUser')
      return null
    }

    const defaultFeatures = DEFAULT_FEATURES
    
    try {
      // VAIHE 1: Hae HETI systemRole (users-taulu) - TÄMÄ ON KRIITTINEN TIETO
      // Tämä on nopea haku (yksi rivi) ja tarvitaan ProtectedRoute-tarkistuksiin
      console.log('[AuthContext] Fetching user profile for:', sessionUser.email)
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', sessionUser.id)
        .maybeSingle()
      
      console.log('[AuthContext] User data from DB:', {
        found: !!userData,
        error: userError,
        role: userData?.role,
        auth_user_id: sessionUser.id
      })
      
      let systemRole = userData?.role || 'user'
      let company_id = userData?.company_id || null
      let features = Array.isArray(userData?.features) ? userData.features : defaultFeatures
      
      // Jos käyttäjä on system admin/moderator, aseta organisaatio
      if (userData && (userData.role === 'admin' || userData.role === 'moderator')) {
        setOrganization({
          id: userData.id,
          role: userData.role,
          data: userData
        })
      }

      // Palauta käyttäjä heti systemRolella (ei jumita)
      const userWithRole = {
        ...sessionUser,
        systemRole: systemRole,
        company_id: company_id,
        features: features,
        organizationRole: null, // Päivitetään taustalla
        organizationId: null // Päivitetään taustalla
      }
      
      console.log('[AuthContext] Returning user with role:', {
        email: sessionUser.email,
        systemRole: userWithRole.systemRole,
        hasSystemRole: 'systemRole' in userWithRole
      })
      
      setProfileLoaded(true) // SystemRole ladattu - ProtectedRoute voi toimia!

      // VAIHE 2: Hae organisaatiorooli TAUSTALLA (ei blokkaa)
      const loadOrgDetails = async () => {
        try {
          const { data: orgMember } = await supabase
            .from('org_members')
            .select('org_id, role')
            .eq('auth_user_id', sessionUser.id)
            .maybeSingle()

          if (orgMember) {
            const { data: org } = await supabase
              .from('users')
              .select('*')
              .eq('id', orgMember.org_id)
              .single()
            
            if (org) {
              // Päivitä organisaatiotiedot
              setOrganization({
                id: orgMember.org_id,
                role: orgMember.role,
                data: org
              })
              
              // Päivitä käyttäjän tiedot organisaation tiedoilla
              setUser(prev => ({
                ...prev,
                organizationRole: orgMember.role,
                organizationId: orgMember.org_id,
                features: systemRole === 'admin' || systemRole === 'moderator' 
                  ? prev.features 
                  : (Array.isArray(org.features) ? org.features : defaultFeatures)
              }))
              
              console.log('[AuthContext] Organization details loaded:', {
                orgId: orgMember.org_id,
                orgRole: orgMember.role
              })
            }
          }
        } catch (error) {
          console.error('Error loading organization details:', error)
        }
      }
      
      // Käynnistä organisaatiohaku taustalla (ei blokkaa)
      loadOrgDetails()
      
      console.log('[AuthContext] SystemRole loaded (fast):', {
        email: sessionUser.email,
        systemRole
      })
      
      return userWithRole
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      setProfileLoaded(true) // Päästä läpi virheen sattuessa
      
      // Palauta peruskäyttäjä virheen sattuessa
      return {
        ...sessionUser,
        systemRole: 'user',
        features: defaultFeatures,
        organizationRole: null,
        organizationId: null,
        company_id: null
      }
    }
  }, [])

  useEffect(() => {
    // POISTETTU: localStorage-logiikka joka asetti käyttäjän ilman systemRole:a
    // onAuthStateChange hoitaa käyttäjän asettamisen oikein
    
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
          setProfileLoaded(false) // Nollaa profiili-tila
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
            setProfileLoaded(false) // Aloita lataus
            
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
          setProfileLoaded(false)
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
    loading: loading || loadingUserProfile || !profileLoaded, // Odota että profiili on ladattu
    loadingUserProfile: loadingUserProfile,
    profileLoaded: profileLoaded,
    signOut: signOut,
    fetchUserProfile: fetchUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}