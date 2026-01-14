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

  // KORJAUS 4: Estetään päällekkäiset fetchUserProfile-kutsut
  const fetchInProgressRef = useRef(false)

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
      console.time('[AuthContext] Total fetchUserProfile')

      // OPTIMOINTI: Hae käyttäjäprofiili ja organisaatiojäsenyys RINNAKKAIN
      console.time('[AuthContext] Promise.all (users + org_members)')
      const queryStartTime = Date.now()
      const [userResult, orgMemberResult] = await Promise.all([
        supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', sessionUser.id)
          .maybeSingle(),
        supabase
          .from('org_members')
          .select('org_id, role')
          .eq('auth_user_id', sessionUser.id)
          .maybeSingle()
      ])
      const queryDuration = Date.now() - queryStartTime
      console.timeEnd('[AuthContext] Promise.all (users + org_members)')
      
      // Varoitus jos kysely kestää yli 3 sekuntia
      if (queryDuration > 3000) {
        console.warn(`[AuthContext] Users/org_members query took ${queryDuration}ms (slow query)`)
      }
      
      // Tarkista virheet
      if (userResult.error) {
        console.error('[AuthContext] Error fetching user data:', userResult.error)
      }
      if (orgMemberResult.error && orgMemberResult.error.code !== 'PGRST116') {
        console.error('[AuthContext] Error fetching org_members:', orgMemberResult.error)
      }

      const userData = userResult.data
      const orgMember = orgMemberResult.data

      let systemRole = userData?.role || 'user'
      let company_id = userData?.company_id || null
      let features = Array.isArray(userData?.features) && userData.features.length > 0
        ? userData.features
        : defaultFeatures

      let organizationRole = null
      let organizationId = null
      let organizationData = null

      // Jos käyttäjä on admin/moderator, käytä omia tietoja organisaationa
      if (userData && (userData.role === 'admin' || userData.role === 'moderator')) {
        organizationData = {
          id: userData.id,
          role: userData.role,
          data: userData
        }
      }

      // Jos käyttäjällä on organisaatiojäsenyys, hae organisaation tiedot
      if (orgMember) {
        console.time('[AuthContext] Fetch org data')
        const orgQueryStartTime = Date.now()
        const { data: org, error: orgError } = await supabase
          .from('users')
          .select('*')
          .eq('id', orgMember.org_id)
          .single()
        const orgQueryDuration = Date.now() - orgQueryStartTime
        console.timeEnd('[AuthContext] Fetch org data')
        
        // Varoitus jos kysely kestää yli 2 sekuntia
        if (orgQueryDuration > 2000) {
          console.warn(`[AuthContext] Org data query took ${orgQueryDuration}ms (slow query)`)
        }
        
        if (orgError) {
          console.error('[AuthContext] Error fetching org data:', orgError)
        }

        if (org) {
          organizationRole = orgMember.role
          organizationId = orgMember.org_id
          organizationData = {
            id: orgMember.org_id,
            role: orgMember.role,
            data: org
          }

          // Käytä organisaation featureja jos ei admin/moderator
          if (systemRole !== 'admin' && systemRole !== 'moderator') {
            features = Array.isArray(org.features) && org.features.length > 0
              ? org.features
              : defaultFeatures
          }
        }
      }

      // Aseta organisaatio KERRAN (ei kaksoispäivitystä)
      if (organizationData) {
        setOrganization(organizationData)
      }

      setProfileLoaded(true)
      console.timeEnd('[AuthContext] Total fetchUserProfile')

      // Palauta täydellinen käyttäjäobjekti KERRAN (ei kaksoispäivitystä)
      return {
        ...sessionUser,
        systemRole: systemRole,
        company_id: company_id,
        features: features,
        organizationRole: organizationRole,
        organizationId: organizationId
      }

    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      console.timeEnd('[AuthContext] Total fetchUserProfile')
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
            event === 'INITIAL_SESSION' ||
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
          
          // KORJAUS 4: Estä päällekkäiset kutsut
          if (fetchInProgressRef.current) {
            console.log('[AuthContext] fetchUserProfile already in progress, skipping')
            return
          }

          try {
            fetchInProgressRef.current = true
            setLoading(true)
            setProfileLoaded(false)

            // Kasvatettu timeout 15 sekuntiin (aikaisemmin 8s) - antaa enemmän aikaa hitaalle yhteyselle
            const TIMEOUT_MS = 15000
            let timeoutId = null
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => {
                reject(new Error(`fetchUserProfile timeout after ${TIMEOUT_MS}ms`))
              }, TIMEOUT_MS)
            })

            try {
              const userWithProfile = await Promise.race([
                fetchUserProfile(session.user),
                timeoutPromise
              ])
              
              // Peruuta timeout jos kysely onnistui ajoissa
              if (timeoutId) clearTimeout(timeoutId)
              
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
            } catch (raceError) {
              // Peruuta timeout jos virhe tapahtui
              if (timeoutId) clearTimeout(timeoutId)
              throw raceError
            }
          } catch (error) {
            // Timeout-virheet loggataan varoituksena, muut virheet normaalisti
            if (error.message && error.message.includes('timeout')) {
              console.warn('[AuthContext] fetchUserProfile timeout - käytetään oletusarvoja')
            } else {
              console.error('[AuthContext] Error in fetchUserProfile:', error)
            }
            setUser({
              ...session.user,
              systemRole: 'user',
              features: DEFAULT_FEATURES,
              organizationId: null,
              organizationRole: null,
              company_id: null
            })
            setProfileLoaded(true)
          } finally {
            fetchInProgressRef.current = false
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
