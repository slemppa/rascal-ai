import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import {
  ACTIVITY_EVENTS,
  getContextTimeout,
  getLastActivity,
  updateLastActivity,
  createActivityDetector,
  createBroadcastChannel,
  WARNING_TIME,
  STORAGE_KEYS
} from '../utils/inactivityUtils'

const AutoLogoutContext = createContext({})

export const useAutoLogout = () => {
  const context = useContext(AutoLogoutContext)
  if (!context) {
    throw new Error('useAutoLogout must be used within an AutoLogoutProvider')
  }
  return context
}

export const AutoLogoutProvider = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [currentTimeout, setCurrentTimeout] = useState(20)
  
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  
  const timeoutRef = useRef(null)
  const warningTimeoutRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const broadcastChannelRef = useRef(null)
  const activityDetectorRef = useRef(null)

  // Ajastimien tyhjennys - määritellään ensin
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  // Logout - määritellään ennen muita funktioita
  const handleLogout = useCallback(async (reason) => {
    clearTimers()
    setIsActive(false)
    setShowWarning(false)
    
    // Ilmoita muille välilehdille logoutista
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'LOGOUT' })
    }
    
    // Tyhjennä localStorage
    localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY)
    
    // Tallenna logout-syy sessionStorageen, jotta AuthContext voi sen hakea
    sessionStorage.setItem('logoutReason', reason)
    
    // Suorita logout - AuthContext käsittelee navigoinnin automaattisesti
    await signOut()
  }, [clearTimers, signOut])

  // Varoitusdialogin sulkeminen
  const hideWarningDialog = useCallback(() => {
    setShowWarning(false)
    setCountdown(0)
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  // Varoitusdialogin näyttö
  const showWarningDialog = useCallback(() => {
    setShowWarning(true)
    setCountdown(WARNING_TIME * 60) // sekunteina
    
    // Countdown timer
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          handleLogout('Sessio päättyi inaktiivisuuden vuoksi')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [handleLogout])

  // Ajastimien nollaus
  const resetTimers = useCallback(() => {
    clearTimers()
    
    if (!isActive) return
    
    const warningTime = (currentTimeout - WARNING_TIME) * 60 * 1000 // millisekunteina
    const logoutTime = currentTimeout * 60 * 1000 // millisekunteina
    
    // Ajastin varoitusta varten
    warningTimeoutRef.current = setTimeout(() => {
      if (isActive) {
        showWarningDialog()
      }
    }, warningTime)
    
    // Ajastin logoutia varten
    timeoutRef.current = setTimeout(() => {
      if (isActive) {
        handleLogout('Sessio päättyi inaktiivisuuden vuoksi')
      }
    }, logoutTime)
  }, [currentTimeout, isActive, clearTimers, showWarningDialog, handleLogout])

  // Inaktiivisuuden tarkistus
  const checkInactivity = useCallback(() => {
    const lastActivity = getLastActivity()
    const now = Date.now()
    const inactiveTime = (now - lastActivity) / 1000 / 60 // minuutteina
    
    const warningTime = currentTimeout - WARNING_TIME
    
    if (inactiveTime >= currentTimeout) {
      // Aika umpeutunut - logout
      handleLogout('Sessio päättyi inaktiivisuuden vuoksi')
    } else if (inactiveTime >= warningTime && !showWarning) {
      // Näytä varoitus
      showWarningDialog()
    }
  }, [currentTimeout, showWarning, handleLogout, showWarningDialog])

  // Sessio jatkaminen
  const extendSession = useCallback(() => {
    updateLastActivity()
    hideWarningDialog()
    resetTimers()
    
    // Ilmoita muille välilehdille aktiviteetista
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'ACTIVITY' })
    }
  }, [hideWarningDialog, resetTimers])

  // Aktiviteetin pysäyttäminen/jatkaminen
  const setActivityState = useCallback((active) => {
    setIsActive(active)
    if (active) {
      updateLastActivity()
      resetTimers()
    } else {
      clearTimers()
    }
  }, [resetTimers, clearTimers])

  // BroadcastChannel viestien kuuntelu
  useEffect(() => {
    broadcastChannelRef.current = createBroadcastChannel('rascal-auto-logout')
    
    if (broadcastChannelRef.current) {
      const handleMessage = (event) => {
        if (event.data.type === 'LOGOUT') {
          handleLogout('Sessio päättyi toisessa välilehdessä')
        } else if (event.data.type === 'ACTIVITY') {
          resetTimers()
        }
      }
      
      broadcastChannelRef.current.addEventListener('message', handleMessage)
      
      return () => {
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.removeEventListener('message', handleMessage)
          broadcastChannelRef.current.close()
        }
      }
    }
  }, [handleLogout, resetTimers])

  // Aktiviteetin tunnistus
  useEffect(() => {
    const handleActivity = createActivityDetector(() => {
      if (isActive) {
        resetTimers()
        // Ilmoita muille välilehdille aktiviteetista
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({ type: 'ACTIVITY' })
        }
      }
    })

    activityDetectorRef.current = handleActivity

    // Lisää event listenerit
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Lisää visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tarkista inaktiivisuus kun välilehti tulee aktiiviseksi
        checkInactivity()
      } else {
        // Pysäytä ajastimet kun välilehti ei ole aktiivinen
        clearTimers()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearTimers()
    }
  }, [isActive, resetTimers, checkInactivity, clearTimers])

  // Timeout-asetuksen päivitys kun sijainti muuttuu
  useEffect(() => {
    const newTimeout = getContextTimeout(location.pathname)
    setCurrentTimeout(newTimeout)
    
    if (isActive) {
      resetTimers()
    }
  }, [location.pathname, isActive, resetTimers])

  // Inaktiivisuuden tarkistus kun komponentti mountataan
  useEffect(() => {
    if (isActive) {
      checkInactivity()
      resetTimers()
    }
  }, [isActive, checkInactivity, resetTimers])

  const value = {
    showWarning,
    countdown,
    isActive,
    currentTimeout,
    extendSession,
    handleLogout,
    setActivityState,
    hideWarningDialog
  }

  return (
    <AutoLogoutContext.Provider value={value}>
      {children}
    </AutoLogoutContext.Provider>
  )
} 