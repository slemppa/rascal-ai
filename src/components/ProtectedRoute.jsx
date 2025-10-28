import React, { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useFeatures } from '../hooks/useFeatures'
import './ProtectedRoute.css'

const featureMap = {
  '/posts': 'Social Media',
  '/strategy': 'Social Media',
  '/calls': 'Phone Calls',
  '/ai-chat': 'Marketing assistant',
}

const ProtectedRoute = ({ children, requiredFeatures = [], requiredRole = null }) => {
  const auth = useAuth()
  const { user, loading } = auth
  const navigate = useNavigate()
  const { has: hasFeature, loading: featuresLoading } = useFeatures()
  const [roleChecked, setRoleChecked] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)

  useEffect(() => {
    if (!requiredRole || !user) {
      setRoleChecked(true)
      return
    }

    const checkUserRole = async () => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('auth_user_id', user.id)
          .single()

        if (error || !userData) {
          setHasAccess(false)
          setRoleChecked(true)
          navigate('/')
          return
        }

        const isAdmin = userData.role === 'admin' || userData.company_id === 1
        const isModerator = userData.role === 'moderator' || isAdmin

        console.log('ProtectedRoute - User data:', userData)
        console.log('ProtectedRoute - Required role:', requiredRole)
        console.log('ProtectedRoute - isAdmin:', isAdmin, 'isModerator:', isModerator)

        if (requiredRole === 'admin' && !isAdmin) {
          console.log('ProtectedRoute - Access denied: not admin')
          setHasAccess(false)
          navigate('/')
        } else if (requiredRole === 'moderator' && !isModerator) {
          console.log('ProtectedRoute - Access denied: not moderator')
          setHasAccess(false)
          navigate('/')
        } else {
          console.log('ProtectedRoute - Access granted')
          setHasAccess(true)
        }
        setRoleChecked(true)
      } catch (error) {
        console.error('Error checking user role:', error)
        setHasAccess(false)
        setRoleChecked(true)
        navigate('/')
      }
    }

    checkUserRole()
  }, [requiredRole, user, navigate])

  if (loading || featuresLoading || !roleChecked) {
    return <div className="protected-route-loading">Ladataan...</div>
  }

  if (!user || !hasAccess) {
    return <Navigate to="/" replace />
  }

  // Tarkista features
  if (requiredFeatures.length > 0) {
    const hasRequiredFeatures = requiredFeatures.every(feature => hasFeature(feature))
    if (!hasRequiredFeatures) {
      return <div className="protected-route-error">Sinulla ei ole tarvittavia oikeuksia tälle sivulle.</div>
    }
  }

  return children
}

export default ProtectedRoute