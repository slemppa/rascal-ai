import { createClient } from '@supabase/supabase-js'
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const base = 'https://mixpost.mak8r.fi'
    let { workspace_uuid: workspaceUuid, mode } = req.query || {}

    // Luo supabase-yhteys, jotta voidaan hakea api_token tarvittaessa
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    const accessToken = req.headers['authorization']?.replace('Bearer ', '')
    const supabase = accessToken && supabaseAnonKey
      ? createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: `Bearer ${accessToken}` } } })
      : null

    let apiToken = null
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('user_mixpost_config')
          .select('mixpost_api_token, mixpost_workspace_uuid')
          .single()
        if (!error && data) {
          apiToken = data.mixpost_api_token || null
          if (!workspaceUuid) workspaceUuid = data.mixpost_workspace_uuid || workspaceUuid
        }
      } catch (_) {
        // ignore
      }
    }

    // Suosi provider-reittejä ensin, jotta saadaan suora 302 LinkedIniin
    const candidates = [
      '/mixpost/accounts/add/linkedin',
      '/mixpost/oauth/linkedin/redirect',
      '/mixpost/oauth/linkedin',
      '/mixpost/auth/linkedin',
      '/mixpost/connect/linkedin',
      '/mixpost/services/linkedin/connect',
      '/oauth/linkedin/redirect',
      '/oauth/linkedin',
      // UI-sivut fallbackiksi
      ...(workspaceUuid ? [
        `/mixpost/workspace/${workspaceUuid}/accounts`,
        `/mixpost/workspaces/${workspaceUuid}/accounts`,
        `/mixpost/${workspaceUuid}/accounts`
      ] : []),
      '/mixpost/accounts',
      '/mixpost'
    ]

    const tryFetch = async (path) => {
      const url = `${base}${path}`
      const tryOnce = async (method) => {
        try {
          const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
          if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`
          const resp = await fetch(url, { method, redirect: 'manual', headers })
          if (resp.status >= 300 && resp.status < 400) {
            const location = resp.headers.get('location')
            if (location && /^https?:\/\//i.test(location)) {
              return { redirectUrl: location }
            }
            return { redirectUrl: url }
          }
          if (resp.status >= 200 && resp.status < 300) {
            return { redirectUrl: url }
          }
          return null
        } catch (_) {
          return null
        }
      }

      // Yritä GET ensin, sitten POST fallback
      return (await tryOnce('GET')) || (await tryOnce('POST'))
    }

    for (const path of candidates) {
      const result = await tryFetch(path)
      if (result && result.redirectUrl) {
        if (mode === 'json') {
          return res.status(200).json({ redirectUrl: result.redirectUrl })
        } else {
          res.statusCode = 302
          res.setHeader('Location', result.redirectUrl)
          return res.end()
        }
      }
    }

    // Fallback: ohjaa Mixpost-etusivulle tai palauta JSON
    if (mode === 'json') {
      return res.status(200).json({ redirectUrl: `${base}/mixpost` })
    } else {
      res.statusCode = 302
      res.setHeader('Location', `${base}/mixpost`)
      return res.end()
    }
  } catch (err) {
    return res.status(500).json({ error: 'Internal error', details: err?.message })
  }
}


