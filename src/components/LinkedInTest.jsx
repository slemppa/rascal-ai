import React, { useState } from 'react'
import LinkedInConnector from './LinkedInConnector'
import { useMixpostIntegration } from './SocialMedia/hooks/useMixpostIntegration'

export default function LinkedInTest() {
  const [message, setMessage] = useState('')
  const { socialAccounts, refreshSocialAccounts, connectSocialAccount, loading, mixpostConfig } = useMixpostIntegration()

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">LinkedIn OAuth -testi</h1>

      <div className="mb-4">
        <LinkedInConnector
          workspaceUuid={mixpostConfig?.mixpost_workspace_uuid}
          onSuccess={async () => {
            setMessage('Yhdistys onnistui. Päivitetään tilit…')
            await refreshSocialAccounts()
            setMessage('Tilit päivitetty.')
          }}
          onError={(err) => {
            setMessage(`Virhe yhdistämisessä: ${err.message}`)
          }}
        />
      </div>

      <div>
        <button
          type="button"
          className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm"
          onClick={() => connectSocialAccount('linkedin').catch(err => setMessage(`Virhe yhdistämisessä: ${err.message}`))}
        >
          Testaa yhdistäminen hookin kautta
        </button>
      </div>

      {message && (
        <div className="mt-4 p-3 rounded bg-gray-100 text-gray-800">{message}</div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-medium mb-2">Yhdistetyt sometilit</h2>
        {loading && <div className="text-sm text-gray-500">Ladataan…</div>}
        {!loading && (!socialAccounts || socialAccounts.length === 0) && (
          <div className="text-sm text-gray-500">Ei yhdistettyjä tilejä</div>
        )}
        <ul className="divide-y divide-gray-200">
          {socialAccounts && socialAccounts.map(acc => (
            <li key={acc.id} className="py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {acc.profile_image_url && (
                  <img src={acc.profile_image_url} alt={acc.name || acc.username} className="w-8 h-8 rounded-full" />
                )}
                <div>
                  <div className="text-sm font-medium">{acc.name || acc.username}</div>
                  <div className="text-xs text-gray-500">{acc.provider}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">{acc.id}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )}


