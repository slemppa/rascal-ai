import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import SegmentForm from '../components/segments/SegmentForm'

export default function SegmentCreatePage() {
  const { user } = useAuth()
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Luo uusi segmentti</h1>
      <SegmentForm userId={user?.id} />
    </div>
  )
}


