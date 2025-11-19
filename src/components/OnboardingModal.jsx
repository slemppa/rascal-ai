import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useConversation } from '@elevenlabs/react'
import VoiceOrb from './VoiceOrb'
import './OnboardingModal.css'

const OnboardingModal = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [shouldShow, setShouldShow] = useState(false)
  const [loading, setLoading] = useState(true)
  const [conversationId, setConversationId] = useState(null)
  const conversationIdRef = useRef(null)
  
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

        // Tarkista onko käyttäjä kutsuttu käyttäjä (ei owner)
        // Vain owner-käyttäjät (jotka luovat oman organisaationsa) näkevät onboardingin
        // Kutsutut käyttäjät (member/admin) ohitetaan
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (!orgError && orgMember) {
          // Jos käyttäjä on kutsuttu käyttäjä (ei owner), ei näytetä onboardingia
          if (orgMember.role !== 'owner') {
            console.log('⏸️ OnboardingModal: Käyttäjä on kutsuttu käyttäjä (rooli:', orgMember.role, '), ei näytetä onboardingia')
            setLoading(false)
            setShouldShow(false)
            return
          }
          // Owner-käyttäjät jatkavat onboarding-tarkistukseen
        }

        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed, role')
          .eq('auth_user_id', user.id)
          .single()

        if (error) throw error

        // Näytä vain jos onboarding ei ole valmis
        const show = data?.onboarding_completed === false
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
    // Lähetä webhook jos keskustelu keskeytetään manuaalisesti
    if (conversationId && user?.id) {
      try {
        await fetch('/api/onboarding-completed', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversationId: conversationId,
            userId: user.id,
            icpData: null // Ei ICP dataa, keskustelu keskeytettiin
          })
        })
      } catch (error) {
        console.error('⚠️ Failed to send end webhook:', error)
      }
    }
    
    await conversation.endSession()
    setConversationId(null)
    conversationIdRef.current = null
  }

  const handleSkip = () => {
    // Sulje modaali, mutta älä tee muutoksia tietokantaan
    setShouldShow(false)
  }

  // Älä näytä jos lataa tai ei pitäisi näkyä
  if (loading || !shouldShow) {
    return null
  }

  return (
    <div className="onboarding-modal-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-modal-header">
          <h2>🎉 Tervetuloa!</h2>
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