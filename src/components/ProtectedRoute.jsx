import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useFeatures } from '../hooks/useFeatures'
import './ProtectedRoute.css'

const ProtectedRoute = ({ children, requiredFeatures = [], requiredRole = null }) => {
  const auth = useAuth()
  const { user, loading } = auth
  const { has: hasFeature, loading: featuresLoading } = useFeatures()
  const location = useLocation()

  console.log('[ProtectedRoute] Check:', {
    path: location.pathname,
    loading,
    featuresLoading,
    user: user ? {
      email: user.email,
      systemRole: user.systemRole,
      organizationRole: user.organizationRole
    } : null,
    requiredRole
  })

  if (loading || featuresLoading) {
    console.log('[ProtectedRoute] Loading...')
    return <div className="protected-route-loading">Ladataan...</div>
  }

  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to login')
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // ROOLITARKISTUS - Tarkistaa nimenomaan systemRole:n (järjestelmätaso)
  if (requiredRole) {
    if (requiredRole === 'admin') {
      if (user.systemRole !== 'admin' && user.systemRole !== 'superadmin') {
        console.log('❌ [ProtectedRoute] Access DENIED:', {
          required: 'admin',
          userSystemRole: user.systemRole,
          path: location.pathname
        })
        return <Navigate to="/dashboard" replace />
      }
      console.log('✅ [ProtectedRoute] Access GRANTED (admin)')
    } 
    else if (requiredRole === 'moderator') {
      const isModerator = user.systemRole === 'moderator' || user.systemRole === 'admin' || user.systemRole === 'superadmin'
      if (!isModerator) {
        console.log('❌ [ProtectedRoute] Access DENIED:', {
          required: 'moderator',
          userSystemRole: user.systemRole,
          path: location.pathname
        })
        return <Navigate to="/dashboard" replace />
      }
      console.log('✅ [ProtectedRoute] Access GRANTED (moderator or higher)')
    }
  }

  // Feature-tarkistus
  if (requiredFeatures.length > 0) {
    const hasRequiredFeatures = requiredFeatures.every(feature => hasFeature(feature))
    if (!hasRequiredFeatures) {
      return <div className="protected-route-error">Sinulla ei ole tarvittavia oikeuksia tälle sivulle.</div>
    }
  }

  return children
}

export default ProtectedRoute