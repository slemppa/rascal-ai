import React from 'react'
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

  if (loading || featuresLoading) {
    return <div className="protected-route-loading">Ladataan...</div>
  }

  if (!user) {
    navigate('/')
    return null
  }

  // Tarkista rooli-vaatimukset
  if (requiredRole) {
    // Haetaan käyttäjän rooli Supabasesta
    const checkUserRole = async () => {
      try {
        const { data: userData, error } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('auth_user_id', user.id)
          .single()

        if (error || !userData) {
          navigate('/')
          return null
        }

        const isAdmin = userData.role === 'admin' || userData.company_id === 1
        const isModerator = userData.role === 'moderator' || isAdmin

        if (requiredRole === 'admin' && !isAdmin) {
          navigate('/')
          return null
        }

        if (requiredRole === 'moderator' && !isModerator) {
          navigate('/')
          return null
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        navigate('/')
        return null
      }
    }

    checkUserRole()
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