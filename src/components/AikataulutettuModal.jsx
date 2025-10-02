import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from './Button'

const AikataulutettuModal = ({ 
  show, 
  editingPost, 
  onClose, 
  onEdit,
  t 
}) => {
  const { user } = useAuth()
  
  // Funktio kanavan kentän renderöimiseen
  const renderChannelField = (accountId, accountData, index) => {
    // Etsi kanavan nimi Supabase-dataa käyttäen
    // Supabase-datassa mixpost_account_uuid on string, accountId on numero
    const supabaseAccount = socialAccounts.find(acc => 
      acc.mixpost_account_uuid === String(accountId)
    )
    // Käytä username:a jos se on saatavilla (@username), muuten account_name
    const accountName = supabaseAccount?.username ? `@${supabaseAccount.username}` : 
                      supabaseAccount?.account_name || 
                      `Kanava ${accountId}`
    const providerIcon = supabaseAccount?.provider
    
    console.log(`Debug - renderChannelField for accountId ${accountId}:`, {
      accountId,
      supabaseAccount,
      accountName,
      providerIcon,
      channelContent: channelContents[accountId],
      allSocialAccounts: socialAccounts
    })
    
    return (
      <div key={accountId} className="border rounded-lg p-4 bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="text-sm font-medium text-gray-900">{accountName}</span>
        </label>
        <textarea
          className="form-textarea"
          rows={4}
          value={channelContents[accountId] || formData.content}
          onChange={(e) => setChannelContents({
            ...channelContents,
            [accountId]: e.target.value
          })}
          placeholder={`Teksti kanavalle ${accountName}...`}
        />
      </div>
    )
  }
  
  const [formData, setFormData] = useState({
    content: '',
    date: '',
    time: ''
  })
  const [channelContents, setChannelContents] = useState({}) // account_id -> content
  const [socialAccounts, setSocialAccounts] = useState([]) // Supabase social accounts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [mixpostData, setMixpostData] = useState(null)
  const [fetchingMixpost, setFetchingMixpost] = useState(false)

  // Ei haeta Mixpost-dataa, käytetään Supabase-dataa

  // Hae social accounts Supabasesta
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!user?.id) return
      
      try {
        const { data, error } = await supabase
          .from('user_social_accounts')
          .select('mixpost_account_uuid, provider, account_name, username, profile_image_url')
          .eq('user_id', user.id)
          .eq('is_authorized', true)
        
        if (error) {
          console.error('Error fetching social accounts:', error)
          return
        }
        
        setSocialAccounts(data || [])
      } catch (error) {
        console.error('Error fetching social accounts:', error)
      }
    }

    fetchSocialAccounts()
  }, [user?.id])

  // Päivitä formData kun editingPost muuttuu
  useEffect(() => {
    if (editingPost) {
      let dateStr = ''
      let timeStr = ''
      let postBody = ''
      
      // Parsitaan päivämäärä ja aika datasta (Supabase tai Mixpost)
      let dateTimeStr = null
      if (editingPost.source === 'supabase') {
        dateTimeStr = editingPost.originalData?.mixpost_scheduled_at || editingPost.originalData?.publish_date
      } else if (editingPost.source === 'mixpost') {
        dateTimeStr = editingPost.scheduled_at
      }
      
      if (dateTimeStr) {
        try {
          const date = new Date(dateTimeStr)
          
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          dateStr = `${year}-${month}-${day}`
          
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          timeStr = `${hours}:${minutes}`
        } catch (e) {
          console.error('Error parsing date:', e)
        }
      }

      // Asetetaan postauksen sisältö - Supabase tai Mixpost
      if (editingPost.source === 'supabase') {
        postBody = editingPost.caption || ''
      } else if (editingPost.source === 'mixpost') {
        // Mixpost-data: käytä versions[0].content[0].body
        postBody = editingPost.versions?.[0]?.content?.[0]?.body || editingPost.caption || ''
        // Poista HTML-tagit jos on
        if (postBody && postBody.includes('<div>')) {
          postBody = postBody.replace(/<div>/g, '').replace(/<\/div>/g, '')
        }
      } else {
        postBody = editingPost.caption || ''
      }

      setFormData({
        content: postBody,
        date: dateStr,
        time: timeStr
      })

      // Alusta channelContents jokaiselle kanavalle
      const channelContentsData = {}
      
      // Jos versions löytyy, käytä sitä
      if (editingPost.versions && editingPost.versions.length > 0) {
        editingPost.versions.forEach(version => {
          if (version.account_id !== undefined) {
            const content = version.content?.[0]?.body || postBody
            channelContentsData[version.account_id] = content
          }
        })
      }
      
      // Jos versions ei löydy tai account_id on 0, käytä accounts-dataa
      if (editingPost.accounts && editingPost.accounts.length > 0) {
        editingPost.accounts.forEach(account => {
          const accountId = typeof account === 'object' ? account.id : account
          if (accountId && accountId !== 0 && !channelContentsData[accountId]) {
            channelContentsData[accountId] = postBody
          }
        })
      }
      
      console.log('Debug - Initializing channelContents:', channelContentsData)
      setChannelContents(channelContentsData)
    }
  }, [editingPost])

  if (!show || !editingPost) return null

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Haetaan käyttäjän user_id users taulusta (sama logiikka kuin ManagePostsPage)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getSession()).data.session?.user?.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Haetaan Mixpost post UUID - Supabase-datasta tai Mixpost-datasta
      let postUuid = null
      
      if (editingPost.source === 'supabase') {
        // Supabase-data: käytä mixpost_post_id originalData:sta
        postUuid = editingPost.originalData?.mixpost_post_id
      } else if (editingPost.source === 'mixpost') {
        // Mixpost-data: hae Supabase-data Mixpost UUID:n perusteella
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('content')
          .select('mixpost_post_id, caption, mixpost_scheduled_at')
          .eq('mixpost_post_id', editingPost.uuid)
          .eq('user_id', userData.id)
          .single()

        if (supabaseError || !supabaseData) {
          throw new Error('Supabase-data ei löytynyt Mixpost UUID:lle')
        }

        postUuid = editingPost.uuid // Käytä Mixpost UUID:ta
        console.log('Debug - Found Supabase data:', supabaseData)
      }

      console.log('Debug - editingPost.source:', editingPost.source)
      console.log('Debug - editingPost.uuid:', editingPost.uuid)
      console.log('Debug - editingPost.id:', editingPost.id)
      console.log('Debug - postUuid:', postUuid)

      if (!postUuid) {
        throw new Error('Mixpost post UUID puuttuu. Varmista että postaus on Mixpostissa.')
      }

      // Rakennetaan päivitysdata Mixpost API:n mukaisesti
      // Käytetään dokumentaation mukaista muotoa - vain muuttuneet kentät
      const originalVersions = editingPost.versions || []
      // Jos account_id on 0, luo versions accounts-datasta
      let versionsToUpdate = originalVersions
      
      if (originalVersions.length > 0 && originalVersions[0].account_id === 0 && editingPost.accounts && editingPost.accounts.length > 0) {
        // Luo versions accounts-datasta
        versionsToUpdate = editingPost.accounts.map(account => {
          const accountId = typeof account === 'object' ? account.id : account
          return {
            account_id: accountId,
            is_original: true,
            content: [{
              body: channelContents[accountId] || formData.content,
              media: editingPost.versions?.[0]?.content?.[0]?.media || []
            }],
            options: originalVersions[0]?.options || {}
          }
        })
      }
      
      const updatedVersions = versionsToUpdate.map(version => {
        // Käytä kanavan omaa tekstiä jos se on määritelty, muuten käytä päätekstiä
        const channelContent = channelContents[version.account_id] || formData.content
        
        console.log(`Debug - Version ${version.account_id}:`, {
          originalContent: version.content?.[0]?.body,
          channelContent: channelContent,
          channelContents: channelContents,
          formDataContent: formData.content
        })
        
        return {
          account_id: version.account_id,
          is_original: version.is_original,
          content: version.content?.map(content => ({
            body: channelContent,
            // Media-kenttä pitää olla integer-array, ei objekti-array
            media: Array.isArray(content.media) 
              ? content.media.map(m => typeof m === 'object' ? parseInt(m.id) : parseInt(m)).filter(id => !isNaN(id))
              : []
          })) || [{ body: channelContent, media: [] }],
          options: version.options
        }
      })

      // Rakennetaan updateData Mixpost API:n dokumentaation mukaan
      // Dokumentaatio vaatii: date, time, timezone, accounts, tags, versions
      const updateData = {
        versions: updatedVersions
      }

      // Jos päivämäärä ja aika on valittu, tarkistetaan että se on tulevaisuudessa
      if (formData.date && formData.time) {
        // Tarkista että päivämäärä on tulevaisuudessa (Helsinki-aikavyöhyke)
        const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
        const now = new Date()
        
        // Vertaa Helsinki-aikavyöhykkeessä
        const helsinkiNow = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Helsinki"}))
        const helsinkiSelected = new Date(selectedDateTime.toLocaleString("en-US", {timeZone: "Europe/Helsinki"}))
        
        if (helsinkiSelected <= helsinkiNow) {
          throw new Error('Valitse tulevaisuuden päivämäärä ja aika')
        }
        
        // Mixpost API:n dokumentaation mukaan: lähetä lokaali päivä ja aika aikavyöhykkeen kanssa
        // Ei muunnoksia, Mixpost API käsittelee aikavyöhykkeen automaattisesti
        updateData.date = formData.date // YYYY-MM-DD (lokaali päivä)
        updateData.time = formData.time   // HH:MM (lokaali aika)
        updateData.timezone = 'Europe/Helsinki' // Aikavyöhyke
        
        // Debug: näytä mitä lähetetään
        const helsinkiDateTime = new Date(`${formData.date}T${formData.time}`)
        
        console.log('Debug - User selected (Helsinki):', formData.date, formData.time)
        console.log('Debug - Sending to Mixpost (local):', updateData.date, updateData.time, updateData.timezone)
        console.log('Debug - Helsinki datetime:', helsinkiDateTime.toISOString())
        console.log('Debug - Expected: Mixpost should preserve Helsinki time with timezone')
        console.log('Debug - Channel contents:', channelContents)
        console.log('Debug - Social accounts from Supabase:', socialAccounts)
        console.log('Debug - Updated versions:', updatedVersions.map(v => ({
          account_id: v.account_id,
          content: v.content?.[0]?.body
        })))
        console.log('Debug - Full updateData being sent:', JSON.stringify(updateData, null, 2))
      }

      // Lisätään alkuperäiset accounts ja tags jos ne löytyvät
      // Tarkista ensin editingPost-objektista accounts
      if (editingPost.accounts && editingPost.accounts.length > 0) {
        updateData.accounts = editingPost.accounts.map(acc => 
          typeof acc === 'object' ? acc.id : acc
        ).filter(id => !isNaN(id) && id !== 0)
      }
      
      // Tags löytyvät yleensä editingPost-objektista
      if (editingPost.tags && editingPost.tags.length > 0) {
        updateData.tags = editingPost.tags.map(tag => 
          typeof tag === 'object' ? tag.id : tag
        ).filter(id => !isNaN(id))
      }

      console.log('Debug - Sending updateData:', updateData)
      console.log('Debug - Media in first version:', updatedVersions[0]?.content?.[0]?.media)
      console.log('Debug - Original accounts:', editingPost.accounts?.length || 0)
      console.log('Debug - Original tags:', editingPost.tags?.length || 0)
      console.log('Debug - Original scheduled_at:', editingPost.scheduled_at)
      console.log('Debug - UpdateData accounts:', updateData.accounts)
      console.log('Debug - UpdateData tags:', updateData.tags)
      console.log('Debug - Versions account_ids:', updatedVersions.map(v => v.account_id))

      // Kutsu backend-endpointtia
      const response = await fetch('/api/mixpost-update-post', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          postUuid,
          updateData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Update API error:', errorData)
        throw new Error(errorData.error || 'Tallennus epäonnistui')
      }

      const updateResult = await response.json()
      console.log('Update API success:', updateResult)

      // Päivitä Supabase-data jos kyseessä on Mixpost-postaus
      if (editingPost.source === 'mixpost') {
        const { error: updateError } = await supabase
          .from('content')
          .update({
            caption: formData.content,
            updated_at: new Date().toISOString()
          })
          .eq('mixpost_post_id', editingPost.uuid)
          .eq('user_id', userData.id)

        if (updateError) {
          console.warn('Supabase-päivitys epäonnistui:', updateError)
          // Ei heitä virhettä, koska Mixpost-päivitys onnistui
        }
      }

      // Jos päivämäärä ja aika on asetettu, kutsutaan schedule-endpointtia
      // Mixpost API:n dokumentaation mukaan schedule-endpointtia käytetään ajastamiseen
      if (updateData.date && updateData.time) {
        console.log('Debug - Scheduling post with date/time/timezone:', updateData.date, updateData.time, updateData.timezone)
        
        try {
          const scheduleResponse = await fetch('/api/mixpost-schedule-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              postUuid,
              postNow: false,  // false = ajastetaan date/time mukaan, true = julkaistaan heti
              updateData: updateData  // Lähetetään myös media-data
            })
          })

          if (!scheduleResponse.ok) {
            const errorData = await scheduleResponse.json()
            console.error('Schedule API error:', errorData)
            throw new Error(`Schedule-päivitys epäonnistui: ${errorData.error || errorData.details || 'Tuntematon virhe'}`)
          }

          const scheduleResult = await scheduleResponse.json()
          console.log('Debug - Post scheduled successfully:', scheduleResult)
        } catch (scheduleError) {
          console.error('Schedule error:', scheduleError)
          // Ei heitä virhettä, koska sisältö päivittyi onnistuneesti
          setError(`Sisältö päivittyi, mutta ajastus epäonnistui: ${scheduleError.message}`)
        }
      }

      setSuccess(true)
      
      // Kutsutaan onEdit callbackia jos se on määritelty
      if (onEdit) {
        onEdit()
      }

      // Suljetaan modaali 1.5 sekunnin kuluttua
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err) {
      console.error('Error updating post:', err)
      setError(err.message || 'Tallennus epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-container edit-post-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingPost?.status === 'Luonnos' ? 'Luonnos postaus' : 'Aikataulutettu postaus'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-content">
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', color: '#c33', borderRadius: '4px' }}>
              {error}
            </div>
          )}
          
          {success && (
            <div className="success-message" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#efe', color: '#3c3', borderRadius: '4px' }}>
              Postaus päivitetty onnistuneesti!
            </div>
          )}

          {/* Media-preview */}
          <div className="form-group">
            <label className="form-label">Media</label>
            <div style={{ 
              maxWidth: '300px', 
              maxHeight: '200px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#f9fafb'
            }}>
              {(() => {
                // Hae media URL editingPost-datasta
                let mediaUrl = null
                
                if (editingPost.source === 'mixpost' && editingPost.versions?.[0]?.content?.[0]?.media?.[0]) {
                  // Mixpost-data: hae media URL
                  const mediaItem = editingPost.versions[0].content[0].media[0]
                  if (typeof mediaItem === 'object' && mediaItem.url) {
                    mediaUrl = mediaItem.url
                  } else if (typeof mediaItem === 'string') {
                    mediaUrl = mediaItem
                  }
                } else if (editingPost.source === 'supabase') {
                  // Supabase-data: käytä thumbnail tai media_urls
                  mediaUrl = editingPost.thumbnail || editingPost.media_urls?.[0]
                }
                
                if (!mediaUrl) {
                  return (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      height: '200px',
                      color: '#6b7280'
                    }}>
                      Ei mediaa
                    </div>
                  )
                }
                
                // Video-tarkistus
                if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                  return (
                    <video 
                      src={mediaUrl} 
                      style={{ 
                        width: '100%', 
                        height: '200px', 
                        objectFit: 'cover' 
                      }}
                      controls
                    />
                  )
                }
                
                // Kuva
                return (
                  <img 
                    src={mediaUrl} 
                    alt="Postauksen media"
                    style={{ 
                      width: '100%', 
                      height: '200px', 
                      objectFit: 'cover' 
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                )
              })()}
              
              {/* Fallback placeholder */}
              <div style={{ 
                display: 'none', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '200px',
                color: '#6b7280'
              }}>
                Media ei lataa
              </div>
            </div>
          </div>

          {/* Näytetään nykyinen ajastettu ajankohta */}
          {(() => {
            let dateTimeStr = null
            if (editingPost.source === 'supabase') {
              dateTimeStr = editingPost.originalData?.mixpost_scheduled_at || editingPost.originalData?.publish_date
            } else if (editingPost.source === 'mixpost') {
              dateTimeStr = editingPost.scheduled_at
            }
            return dateTimeStr
          })() && (
            <div className="form-group">
              <div style={{ 
                padding: '1rem', 
                backgroundColor: '#f0f9ff', 
                border: '1px solid #0ea5e9', 
                borderRadius: '6px',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#0369a1', marginBottom: '0.25rem' }}>
                  📅 Ajastettu julkaisuajankohta
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0c4a6e' }}>
                  {(() => {
                    try {
                      let dateTimeStr = null
                      if (editingPost.source === 'supabase') {
                        dateTimeStr = editingPost.originalData?.mixpost_scheduled_at || editingPost.originalData?.publish_date
                      } else if (editingPost.source === 'mixpost') {
                        dateTimeStr = editingPost.scheduled_at
                      }
                      
                      if (dateTimeStr) {
                        const date = new Date(dateTimeStr)
                        return date.toLocaleString('fi-FI', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                      return 'Ei ajankohtaa'
                    } catch (e) {
                      return 'Virhe ajankohdassa'
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Näytetään statustieto */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <p className="form-text" style={{ 
              display: 'inline-block',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '600',
              backgroundColor: editingPost.status === 'Aikataulutettu' ? '#dbeafe' : 
                               editingPost.status === 'Luonnos' ? '#fef3c7' : '#f3f4f6',
              color: editingPost.status === 'Aikataulutettu' ? '#1e40af' : 
                     editingPost.status === 'Luonnos' ? '#92400e' : '#374151'
            }}>
              {editingPost.status || 'Ei statusta'}
            </p>
          </div>


          <div className="form-group">
            <label className="form-label">Postaus (pääteksti)</label>
            <textarea
              className="form-textarea"
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Kirjoita postauksen teksti..."
            />
          </div>

          {/* Per-kanava muokkauskentät */}
          {editingPost.accounts && editingPost.accounts.length > 1 && (
            <div className="form-group">
              <label className="form-label">Teksti per kanava</label>
              <div className="space-y-4">
                {editingPost.accounts.map((account, index) => {
                  const accountId = typeof account === 'object' ? account.id : account
                  if (!accountId || accountId === 0) return null
                  
                  console.log(`Debug - Processing account ${index}:`, {
                    account,
                    accountId,
                    socialAccounts: socialAccounts
                  })
                  
                  return renderChannelField(accountId, account, index)
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Julkaisupäivä</label>
            <input
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Julkaisuaika</label>
            <input
              type="time"
              className="form-input"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>


          <div className="modal-actions">
            <div className="modal-actions-left">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Peruuta
              </Button>
            </div>
            <div className="modal-actions-right">
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Tallennetaan...' : 'Tallenna'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AikataulutettuModal
