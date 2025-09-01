import React, { useState } from 'react'

export default function LinkedInConnector({ onSuccess, onError, workspaceUuid }) {
  const [connecting, setConnecting] = useState(false)

  const MIXPOST_PROXY = '/api/mixpost-linkedin'

  const openPopup = (url) => {
    console.log('[LinkedInConnector] Avataan popup:', url)
    const features = 'width=600,height=700,menubar=no,toolbar=no,location=yes,status=no,scrollbars=yes,resizable=yes'
    return window.open(url, 'linkedin_oauth', features)
  }


  const startOAuthViaProxy = async () => {
    const url = workspaceUuid ? `${MIXPOST_PROXY}?workspace_uuid=${encodeURIComponent(workspaceUuid)}` : MIXPOST_PROXY
    console.log('[LinkedInConnector] Avaa proxy:', url)
    const popup = openPopup(url)
    if (!popup) {
      setConnecting(false)
      onError && onError(new Error('Popup estetty. Salli popup-ikkunat tälle sivustolle.'))
      return
    }
    await pollPopup(popup)
  }

  const pollPopup = (popup) => {
    return new Promise((resolve) => {
      let elapsed = 0
      const intervalMs = 1000
      const maxWaitMs = 5 * 60 * 1000
      const interval = setInterval(async () => {
        try {
          if (popup.closed) {
            clearInterval(interval)
            setConnecting(false)
            console.log('[LinkedInConnector] Popup sulkeutui, päivitetään tilit')
            onSuccess && onSuccess()
            return resolve()
          }
          elapsed += intervalMs
          if (elapsed >= maxWaitMs) {
            clearInterval(interval)
            setConnecting(false)
            if (!popup.closed) popup.close()
            console.error('[LinkedInConnector] OAuth-yhdistys aikakatkaistiin 5 minuutin jälkeen')
            onError && onError(new Error('OAuth-yhdistys aikakatkaistiin 5 minuutin jälkeen.'))
            return resolve()
          }
        } catch (_) {
          // cross-origin, jatka pollingia
        }
      }, intervalMs)
    })
  }

  const handleConnect = () => {
    try {
      setConnecting(true)
      // Käytä aina backend-proxyä (kiertää 405/CORS)
      void startOAuthViaProxy()
    } catch (err) {
      setConnecting(false)
      onError && onError(err)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleConnect}
        className={`px-4 py-2 rounded-md text-white ${connecting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} transition-colors`}
        disabled={connecting}
      >
        {connecting ? 'Yhdistetään…' : 'Yhdistä LinkedIn-tili'}
      </button>
      <p className="text-sm text-gray-500">Käytä Mixpost OAuth -ikkunaa LinkedIn-yhdistämiseen.</p>
    </div>
  )
}


