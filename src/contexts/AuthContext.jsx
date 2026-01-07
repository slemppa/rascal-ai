import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
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
  const [profileLoaded, setProfileLoaded] = useState(false)
  const navigate = useNavigate()
  
  // KORJAUS 1: Luodaan ref, joka pitää aina sisällään tuoreimman user-objektin
  const userRef = useRef(user)

  // KORJAUS 2: Päivitetään ref aina kun user-tila muuttuu
  useEffect(() => {
    userRef.current = user
  }, [user])

  const fetchUserProfile = useCallback(async (sessionUser) => {
    if (!sessionUser) {
      console.error('fetchUserProfile called without sessionUser')
      return null
    }

    const defaultFeatures = DEFAULT_FEATURES
    
    try {
      console.log('[AuthContext] Fetching user profile for:', sessionUser.email)
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', sessionUser.id)
        .maybeSingle()
      
      let systemRole = userData?.role || 'user'
      let company_id = userData?.company_id || null
      let features = Array.isArray(userData?.features) ? userData.features : defaultFeatures
      
      if (userData && (userData.role === 'admin' || userData.role === 'moderator')) {
        setOrganization({
          id: userData.id,
          role: userData.role,
          data: userData
        })
      }

      const userWithRole = {
        ...sessionUser,
        systemRole: systemRole,
        company_id: company_id,
        features: features,
        organizationRole: null,
        organizationId: null
      }
      
      setProfileLoaded(true)

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
              setOrganization({
                id: orgMember.org_id,
                role: orgMember.role,
                data: org
              })
              
              setUser(prev => ({
                ...prev,
                organizationRole: orgMember.role,
                organizationId: orgMember.org_id,
                features: systemRole === 'admin' || systemRole === 'moderator' 
                  ? prev.features 
                  : (Array.isArray(org.features) ? org.features : defaultFeatures)
              }))
            }
          }
        } catch (error) {
          console.error('Error loading organization details:', error)
        }
      }
      
      loadOrgDetails()
      
      return userWithRole
      
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      setProfileLoaded(true)
      
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change:', event, session?.user?.email)
        
        // KORJAUS 3: Käytetään ref-arvoa tarkistuksissa (tämä on se "stale closure" korjaus)
        const currentUser = userRef.current

        if (event === 'SIGNED_OUT') {
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('sb-')) {
              localStorage.removeItem(key)
            }
          })
          setUser(null)
          setOrganization(null)
          setProfileLoaded(false)
          setLoading(false)
          
          const logoutReason = sessionStorage.getItem('logoutReason')
          sessionStorage.removeItem('logoutReason')
          
          navigate('/', { 
            state: { 
              logoutReason: logoutReason || 'Sessio päättyi',
              showLogoutMessage: true 
            } 
          })
        } else if (session?.user) {
          const isSessionUpdate = 
            event === 'TOKEN_REFRESHED' || 
            event === 'USER_UPDATED' || 
            // Varmistetaan että verrataan nykyiseen käyttäjään ref:n kautta
            (event === 'SIGNED_IN' && currentUser && session.user.id === currentUser.id);

          if (isSessionUpdate && currentUser) {
            console.log('[AuthContext] Session update, skipping profile fetch')
            setUser(prev => ({
              ...prev,
              ...session.user,
              systemRole: prev.systemRole,
              features: prev.features,
              organizationId: prev.organizationId,
              organizationRole: prev.organizationRole,
              company_id: prev.company_id
            }))
            return
          }
          
          try {
            setLoading(true)
            setProfileLoaded(false)
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('fetchUserProfile timeout')), 10000)
            )
            
            const userWithProfile = await Promise.race([
              fetchUserProfile(session.user),
              timeoutPromise
            ])
            
            if (userWithProfile) {
              setUser(userWithProfile)
            } else {
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
      sessionStorage.setItem('logoutReason', 'Käyttäjä kirjautui ulos')
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      if (error) {
        console.error('Error signing out:', error.message)
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
    loading: loading || loadingUserProfile || !profileLoaded,
    loadingUserProfile: loadingUserProfile,
    profileLoaded: profileLoaded,
    signOut: signOut,
    fetchUserProfile: fetchUserProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
