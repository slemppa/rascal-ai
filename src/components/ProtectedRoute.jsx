import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const featureMap = {
  '/posts': 'Social Media',
  '/strategy': 'Social Media',
  '/calls': 'Phone Calls',
  '/ai-chat': 'Marketing assistant',
}

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const features = user?.features || []
  const location = useLocation()

  // Selvitä vaadittu feature polun perusteella
  const requiredFeature = Object.entries(featureMap).find(([path]) => location.pathname.startsWith(path))?.[1]

  if (requiredFeature && !features.includes(requiredFeature)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}