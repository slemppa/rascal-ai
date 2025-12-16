import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

// Hakee käyttäjän featuret /api/user-features endpointilta ja tarjoaa has(name)
export function useFeatures() {
  const [features, setFeatures] = useState([])
  const [crmConnected, setCrmConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token
        if (!token) {
          setFeatures([])
          setLoading(false)
          return
        }

        const res = await fetch('/api/users/features', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const json = await res.json()
        if (!cancelled) {
          setFeatures(Array.isArray(json?.features) ? json.features : [])
          setCrmConnected(Boolean(json?.crm_connected))
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e)
          setFeatures([])
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const featureSet = useMemo(() => new Set(features || []), [features])
  const has = (name) => featureSet.has(name)

  return { features, has, crmConnected, loading, error }
}


