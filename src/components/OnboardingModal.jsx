import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useConversation } from '@elevenlabs/react'
import axios from 'axios'
import VoiceOrb from './VoiceOrb'
import './OnboardingModal.css'

const OnboardingModal = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [shouldShow, setShouldShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [conversationId, setConversationId] = useState(null)
  const conversationIdRef = useRef(null)
  const [isMinimized, setIsMinimized] = useState(false)
  
  // ElevenLabs conversation hook
  const conversation = useConversation({
    clientTools: {
      saveICPData: async (parameters) => {
        if (!user?.id) return 'Error: No user logged in'
        
        try {
          // Rakenna ICP data + metadata
          const icpData = {
            ...parameters,
            conversation_id: conversationIdRef.current,
            completed_at: new Date().toISOString()
          }
          
          // Lähetä webhook N8N:ään (N8N hoitaa Supabase-päivityksen)
          const webhookResponse = await fetch('/api/onboarding-completed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              conversationId: conversationIdRef.current,
              userId: user.id,
              icpData: icpData
            })
          })
          
          if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text()
            console.error('❌ Webhook failed:', errorText)
            throw new Error('Failed to send webhook to N8N')
          }
          
          console.log('✅ Webhook sent successfully - N8N will update onboarding_completed and icp_summary')
          
          // Sulje modaali
          setShouldShow(false)
          
          return 'ICP data saved successfully!'
        } catch (error) {
          console.error('❌ Error saving ICP data:', error)
          return 'Error saving ICP data'
        }
      }
    }
  })

  // Tarkista pitääkö modaali näyttää
  useEffect(() => {
    // Estä näyttö tietyillä julkisilla/kriittisillä reiteillä
    const BLOCKED_ROUTES = [
      '/signin',
      '/signup',
      '/reset-password',
      '/forgot-password',
      '/auth/callback',
      '/terms',
      '/privacy',
      '/settings'
    ]

    const isBlocked = BLOCKED_ROUTES.some((path) => location.pathname.includes(path))
    if (isBlocked) {
      setShouldShow(false)
      setLoading(false)
      return
    }

    const checkOnboardingStatus = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Tarkista onko käyttäjällä vahva salasana asetettu
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        // Jos käyttäjällä on recovery tai invite token aktiivisena, älä näytä modaalia
        // Tämä estää modaalin näkymisen salasanan asettamisen aikana
        if (!authUser?.email_confirmed_at && !authUser?.confirmed_at) {
          console.log('⏸️ OnboardingModal: Käyttäjä ei ole vahvistanut sähköpostia, odotetaan...')
          setLoading(false)
          setShouldShow(false)
          return
        }

        // Tarkista käyttäjän rooli org_members taulusta
        // Vain owner- ja admin-käyttäjät näkevät onboardingin
        // Kutsutut käyttäjät (member) ohitetaan
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        let userData = null
        let onboardingCompleted = false

        if (!orgError && orgMember) {
          // Jos käyttäjä on kutsuttu käyttäjä (member), ei näytetä onboardingia
          if (orgMember.role === 'member') {
            console.log('⏸️ OnboardingModal: Käyttäjä on kutsuttu käyttäjä (rooli: member), ei näytetä onboardingia')
            setLoading(false)
            setShouldShow(false)
            return
          }
          
          // Owner- ja admin-käyttäjät: hae organisaation onboarding_completed
          const { data: orgUserData, error: orgUserError } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('id', orgMember.org_id)
            .single()

          if (!orgUserError && orgUserData) {
            userData = orgUserData
            // Varmista että onboarding_completed on eksplisiittisesti true
            // Jos se on false, null tai undefined, näytetään modal
            onboardingCompleted = orgUserData.onboarding_completed === true
            console.log('🔍 OnboardingModal: Owner/Admin käyttäjä, organisaation onboarding:', {
              org_id: orgMember.org_id,
              onboarding_completed: orgUserData.onboarding_completed,
              onboardingCompleted: onboardingCompleted
            })
            
            // Jos onboarding on valmis, EI näytetä modaalia
            if (onboardingCompleted) {
              console.log('✅ OnboardingModal: Organisaation onboarding on valmis, modaali EI näy')
              setLoading(false)
              setShouldShow(false)
              return
            }
          } else {
            console.warn('⚠️ OnboardingModal: Organisaatiota ei löydy users taulusta:', orgUserError)
            // Jos organisaatiota ei löydy, näytetään modal
            onboardingCompleted = false
          }
        } else {
          // Normaali käyttäjä (ei org_members taulussa): hae käyttäjän oma onboarding_completed
          const { data: normalUserData, error: userError } = await supabase
            .from('users')
            .select('onboarding_completed')
            .eq('auth_user_id', user.id)
            .maybeSingle()

          if (userError && userError.code === 'PGRST116') {
            // Käyttäjää ei löydy - oletetaan että onboarding ei ole valmis
            console.log('ℹ️ OnboardingModal: Käyttäjää ei löydy users taulusta, näytetään onboarding')
            onboardingCompleted = false
          } else if (userError) {
            throw userError
          } else if (normalUserData) {
            userData = normalUserData
            // Varmista että onboarding_completed on eksplisiittisesti true
            // Jos se on false, null tai undefined, näytetään modal
            onboardingCompleted = normalUserData.onboarding_completed === true
            console.log('🔍 OnboardingModal: Normaali käyttäjä, onboarding:', {
              onboarding_completed: normalUserData.onboarding_completed,
              onboardingCompleted: onboardingCompleted
            })
            
            // Jos onboarding on valmis, EI näytetä modaalia
            if (onboardingCompleted) {
              console.log('✅ OnboardingModal: Käyttäjän onboarding on valmis, modaali EI näy')
              setLoading(false)
              setShouldShow(false)
              return
            }
          }
        }

        // Tarkista onko modal minimoitu localStorageen
        const skipped = localStorage.getItem(`onboarding_skipped_${user.id}`)
        if (skipped === 'true') {
          setIsMinimized(true)
          setShouldShow(false) // Älä näytä normaalisti jos minimoitu
          setLoading(false)
          return
        }

        // Näytä vain jos onboarding ei ole valmis
        const show = !onboardingCompleted
        console.log('🔍 OnboardingModal status check:', {
          hasUserData: !!userData,
          onboarding_completed: onboardingCompleted,
          shouldShow: show
        })
        setShouldShow(show)
      } catch (error) {
        console.error('❌ Error checking onboarding status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkOnboardingStatus()
  }, [user, location.pathname])

  const handleStartConversation = async () => {
    try {
      // Hae Agent ID API:sta
      const response = await fetch('/api/elevenlabs-config')
      
      if (!response.ok) {
        throw new Error('Failed to fetch ElevenLabs configuration')
      }
      
      const config = await response.json()
      
      if (!config.agentId) {
        console.error('❌ Agent ID not found in API response')
        alert('Virhe: Agent ID puuttuu konfiguraatiosta')
        return
      }

      // Aloita keskustelu
      const convId = await conversation.startSession({
        agentId: config.agentId,
        connectionType: 'websocket',
      })
      
      setConversationId(convId)
      conversationIdRef.current = convId
      
      // Tallenna conversation ID Supabaseen (optionaalinen)
      if (user?.id && convId) {
        try {
          await supabase
            .from('users')
            .update({
              last_conversation_id: convId,
              updated_at: new Date().toISOString()
            })
            .eq('auth_user_id', user.id)
        } catch (error) {
          console.error('⚠️ Failed to save conversation ID:', error)
        }
      }
    } catch (error) {
      console.error('❌ Error starting conversation:', error)
      alert('Virhe aloittaessa keskustelua: ' + error.message)
    }
  }

  const handleEndConversation = async () => {
    // Määritellään requestBody ulommalla tasolla jotta se on näkyvissä kaikissa catch-lohkoissa
    let requestBody = null
    
    try {
      console.log('🛑 Ending conversation...', {
        conversationId: conversationId,
        userId: user?.id,
        conversationStatus: conversation.status
      })

      // Lähetä webhook jos keskustelu keskeytetään manuaalisesti
      // Käytä conversationIdRef.current jos conversationId state on null
      const currentConversationId = conversationId || conversationIdRef.current
      
      if (!currentConversationId) {
        console.warn('⚠️ Cannot send end webhook: conversationId is missing', {
          conversationId: conversationId,
          conversationIdRef: conversationIdRef.current,
          conversationStatus: conversation.status
        })
      } else if (!user?.id) {
        console.warn('⚠️ Cannot send end webhook: userId is missing')
      } else {
        requestBody = {
          conversationId: currentConversationId,
          userId: user.id,
          icpData: null // Ei ICP dataa, keskustelu keskeytettiin
        }
        
        try {
          console.log('📤 Sending end conversation webhook:', {
            conversationId: currentConversationId,
            userId: user.id,
            conversationIdFromState: conversationId,
            conversationIdFromRef: conversationIdRef.current
          })
          
          console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))
          
          // Hae käyttäjän session token Supabasesta
          const { data: { session } } = await supabase.auth.getSession()
          const headers = {
            'Content-Type': 'application/json'
          }
          
          // Lisää Authorization header jos session token on saatavilla
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`
            console.log('🔑 Adding Authorization header to request')
          } else {
            console.warn('⚠️ No session token available, request may fail due to RLS')
          }
          
          const response = await axios.post('/api/onboarding-completed', requestBody, {
            headers: headers
          })

          console.log('✅ End conversation webhook sent:', response.data)
        } catch (error) {
          if (error.response) {
            // Server responded with error status
            console.error('❌ Failed to send end webhook:', {
              status: error.response.status,
              statusText: error.response.statusText,
              error: error.response.data,
              requestBody: requestBody
            })
          } else if (error.request) {
            // Request was made but no response received
            console.error('❌ Failed to send end webhook: No response received', {
              message: error.message,
              requestBody: requestBody
            })
          } else {
            // Error in request setup
            console.error('❌ Error sending end webhook:', error.message)
          }
        }
      }
      
      // Lopeta keskustelu
      try {
        await conversation.endSession()
        console.log('✅ Conversation ended')
      } catch (error) {
        console.error('❌ Error ending conversation:', error)
      }
      
      // Tyhjennä conversation ID:t
      setConversationId(null)
      conversationIdRef.current = null
      
      // Sulje modaali
      setShouldShow(false)
      
    } catch (error) {
      console.error('❌ Error in handleEndConversation:', {
        error: error.message,
        stack: error.stack,
        requestBody: requestBody
      })
      // Sulje modaali vaikka virhe tapahtui
      setShouldShow(false)
    }
  }

  const handleSkip = () => {
    // Minimoi modaali ja tallenna localStorageen
    if (user?.id) {
      localStorage.setItem(`onboarding_skipped_${user.id}`, 'true')
    }
    setIsMinimized(true)
  }
  
  const handleRestore = () => {
    // Palauta modaali normaalikokoon
    setIsMinimized(false)
    setShouldShow(true) // Näytä modal normaalisti
    if (user?.id) {
      localStorage.removeItem(`onboarding_skipped_${user.id}`)
    }
  }

  // Jos minimoitu, näytä vain pieni nappi (näytetään aina jos minimoitu)
  if (isMinimized) {
    return (
      <div className="onboarding-modal-minimized" onClick={handleRestore}>
        <div className="onboarding-modal-minimized-content">
          <span>ICP-haastattelu</span>
          <button className="btn-restore" onClick={(e) => { e.stopPropagation(); handleRestore(); }}>
            Palauta
          </button>
        </div>
      </div>
    )
  }

  // Älä näytä jos lataa tai ei pitäisi näkyä
  if (loading || !shouldShow) {
    return null
  }

  return (
    <div className={`onboarding-modal-overlay ${isMinimized ? 'minimized' : ''}`}>
      <div className={`onboarding-modal ${isMinimized ? 'minimized' : ''}`}>
        <div className="onboarding-modal-header">
          <h2>Tervetuloa!</h2>
          <p>Aloitetaan luomalla yrityksellesi täydellinen ICP (Ideal Customer Profile)</p>
        </div>

        <div className="onboarding-modal-content">
          {conversation.status === 'disconnected' ? (
            <>
              <div className="onboarding-placeholder">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="60" cy="60" r="35" fill="currentColor" opacity="0.1"/>
                  <path d="M60 40 L60 80 M40 60 L80 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
                <h3>Aloita ICP-haastattelu</h3>
                <p>Keskustele AI-assistentin kanssa ja luo yrityksellesi ICP muutamassa minuutissa.</p>
              </div>
              
              <button 
                className="btn-primary btn-large"
                onClick={handleStartConversation}
              >
                Aloita haastattelu
              </button>
            </>
          ) : (
            <div className="conversation-area">
              <VoiceOrb conversation={conversation} />
              
              <button 
                className="btn-secondary"
                onClick={handleEndConversation}
              >
                Lopeta keskustelu
              </button>
            </div>
          )}
        </div>

        <div className="onboarding-modal-footer">
          <button 
            className="btn-text"
            onClick={handleSkip}
          >
            Ohita toistaiseksi
          </button>
        </div>
      </div>
    </div>
  )
}

export default OnboardingModal