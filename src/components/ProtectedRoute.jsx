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

  if (loading || featuresLoading) {
    return <div className="protected-route-loading">Ladataan...</div>
  }

  if (!user) {
    // Ohjaa login-sivulle ja tallenna minne oltiin menossa
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // ROOLITARKISTUS (KORJATTU)
  if (requiredRole) {
    // Jos vaaditaan 'admin' (järjestelmätaso), tarkistetaan systemRole
    if (requiredRole === 'admin') {
      const isAdmin = user.systemRole === 'admin' || user.systemRole === 'superadmin' || user.company_id === 1
      if (!isAdmin) {
        console.log('ProtectedRoute - Access denied: User systemRole is', user.systemRole, 'required: admin')
        return <Navigate to="/" replace />
      }
    } 
    // Jos vaaditaan 'moderator', tarkistetaan systemRole
    else if (requiredRole === 'moderator') {
      const isModerator = user.systemRole === 'moderator' || user.systemRole === 'admin' || user.systemRole === 'superadmin' || user.company_id === 1
      if (!isModerator) {
        console.log('ProtectedRoute - Access denied: User systemRole is', user.systemRole, 'required: moderator')
        return <Navigate to="/" replace />
      }
    }
    // Huom: Jos haluat tarkistaa organisaatioroolin, tekisit: if (requiredRole === 'org_admin' && user.organizationRole !== 'admin')
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