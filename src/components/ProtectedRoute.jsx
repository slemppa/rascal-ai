import React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './ProtectedRoute.css'

const featureMap = {
  '/posts': 'Social Media',
  '/strategy': 'Social Media',
  '/calls': 'Phone Calls',
  '/ai-chat': 'Marketing assistant',
}

const ProtectedRoute = ({ children, requiredFeatures = [] }) => {
  const auth = useAuth()
  const { user, loading } = auth
  const navigate = useNavigate()

  if (loading) {
    return <div className="protected-route-loading">Ladataan...</div>
  }

  if (!user) {
    navigate('/')
    return null
  }

  // Tarkista features
  if (requiredFeatures.length > 0) {
    const userFeatures = user.features || []
    const hasRequiredFeatures = requiredFeatures.every(feature => 
      userFeatures.includes(feature)
    )

    if (!hasRequiredFeatures) {
      return <div className="protected-route-error">Sinulla ei ole tarvittavia oikeuksia tälle sivulle.</div>
    }
  }

  return children
}

export default ProtectedRoute