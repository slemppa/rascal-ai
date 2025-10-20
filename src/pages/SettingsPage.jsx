import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { useTranslation } from 'react-i18next'
import CarouselTemplateSelector from '../components/CarouselTemplateSelector'
import SocialMediaConnect from '../components/SocialMediaConnect'
import TimeoutSettings from '../components/TimeoutSettings'
import SimpleSocialConnect from '../components/SimpleSocialConnect'
import { useMixpostIntegration } from '../components/SocialMedia/hooks/useMixpostIntegration'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'

import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user } = useAuth()
  const { t } = useTranslation('common')
  const { refreshUserStatus, userStatus } = useStrategyStatus()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [showEmailChange, setShowEmailChange] = useState(false)
  const [emailData, setEmailData] = useState({
    newEmail: '',
    confirmEmail: ''
  })
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [syncInProgress, setSyncInProgress] = useState(false)
  
  // Mixpost-integration hook
  const { 
    socialAccounts, 
    savedSocialAccounts, 
    fetchSocialAccounts, 
    fetchSavedSocialAccounts,
    mixpostConfig 
  } = useMixpostIntegration()

  // Synkronoi sometilit Supabaseen
  const syncSocialAccountsToSupabase = async () => {
    if (!user?.id || syncInProgress) return

    setSyncInProgress(true)
    try {
      console.log('🔄 Synkronoidaan sometilejä Supabaseen...')
      
      // Hae olemassa olevat tilit Supabasesta
      const { data: existingAccounts } = await supabase
        .from('user_social_accounts')
        .select('id, mixpost_account_uuid, provider')
        .eq('user_id', user.id)

      // Luo Set Mixpost-tileistä (provider + mixpost_account_uuid)
      const mixpostAccountsSet = new Set(
        socialAccounts?.map(acc => `${acc.provider}:${acc.id}`) || []
      )

      // Luo Set olemassa olevista tileistä (provider + mixpost_account_uuid)
      const existingAccountsSet = new Set(
        existingAccounts?.map(acc => `${acc.provider}:${acc.mixpost_account_uuid}`) || []
      )
      
      // Etsi uudet tilit joita ei ole Supabasessa
      const newAccounts = socialAccounts?.filter(account => {
        const accountKey = `${account.provider}:${account.id}`
        return !existingAccountsSet.has(accountKey)
      }) || []

      // Etsi poistetut tilit (Supabasessa mutta ei Mixpostissa)
      const accountsToRemove = existingAccounts?.filter(account => {
        const accountKey = `${account.provider}:${account.mixpost_account_uuid}`
        return !mixpostAccountsSet.has(accountKey)
      }) || []

      // Lisää uudet tilit Supabaseen
      if (newAccounts.length > 0) {
        console.log(`📝 Lisätään ${newAccounts.length} uutta tiliä Supabaseen`)
        
        const accountsToInsert = newAccounts.map(account => ({
          user_id: user.id,
          mixpost_account_uuid: account.id,
          provider: account.provider,
          account_name: account.name || account.username,
          username: account.username,
          profile_image_url: account.profile_image_url || account.image || account.picture,
          is_authorized: true,
          account_data: account,
          last_synced_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }))

        const { error: insertError } = await supabase
          .from('user_social_accounts')
          .upsert(accountsToInsert, {
            onConflict: 'user_id,mixpost_account_uuid'
          })

        if (insertError) {
          console.error('❌ Virhe uusien tilien lisäämisessä:', insertError)
        }
      }

      // Poista tilit joita ei enää löydy Mixpostista
      if (accountsToRemove.length > 0) {
        console.log(`🗑️ Poistetaan ${accountsToRemove.length} tiliä joita ei enää löydy Mixpostista`)
        
        const idsToRemove = accountsToRemove.map(acc => acc.id)
        
        const { error: deleteError } = await supabase
          .from('user_social_accounts')
          .delete()
          .in('id', idsToRemove)

        if (deleteError) {
          console.error('❌ Virhe tilien poistamisessa:', deleteError)
        }
      }

      if (newAccounts.length === 0 && accountsToRemove.length === 0) {
        console.log('✅ Kaikki sometilit jo synkronoituna')
      } else {
        console.log('✅ Sometilit synkronoitu onnistuneesti')
      }
      
      // Päivitä tallennetut tilit
      await fetchSavedSocialAccounts()

    } catch (error) {
      console.error('❌ Virhe sometilien synkronoinnissa:', error)
    } finally {
      setSyncInProgress(false)
    }
  }

  // Hae käyttäjätiedot public.users taulusta
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching user profile:', error)
          setMessage(t('settings.profile.notFoundSupport'))
        } else {
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setMessage(t('settings.profile.fetchError'))
      } finally {
        setProfileLoading(false)
      }
    }

    fetchUserProfile()
  }, [user?.id])

  // Synkronoi sometilit kun ne on haettu Mixpostista
  useEffect(() => {
    if (socialAccounts !== null && user?.id) {
      syncSocialAccountsToSupabase()
    }
  }, [socialAccounts, user?.id])

  // Käyttäjätiedot public.users taulusta
  const email = userProfile?.contact_email || user?.email || null
  const name = userProfile?.contact_person || null
  const companyName = userProfile?.company_name || null
  const industry = userProfile?.industry || null

  // Muokattavat kentät
  const [formData, setFormData] = useState({
    contact_person: name || '',
    company_name: companyName || '',
    contact_email: email || ''
  })

  useEffect(() => {
    setFormData({
      contact_person: name || '',
      company_name: companyName || '',
      contact_email: email || ''
    })
  }, [name, companyName, email])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!user?.id || !userProfile?.id) return
    
    setLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          contact_person: formData.contact_person,
          company_name: formData.company_name,
          contact_email: formData.contact_email,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)
      
      if (error) {
        setMessage(`${t('settings.common.error')}: ${error.message}`)
      } else {
        setMessage(t('settings.profile.updateSuccess'))
        setIsEditing(false)
        // Päivitä käyttäjätiedot
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', userProfile.id)
          .single()
        if (data) {
          setUserProfile(data)
        }
      }
    } catch (error) {
      setMessage(`${t('settings.common.error')}: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      contact_person: name || '',
      company_name: companyName || '',
      contact_email: email || ''
    })
    setIsEditing(false)
    setMessage('')
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordSave = async () => {
    if (!user) return
    
    // Validoi salasanat
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage(t('settings.password.mismatch'))
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage(t('settings.password.tooShort'))
      return
    }
    
    if (!passwordData.currentPassword) {
      setPasswordMessage(t('settings.password.currentRequired'))
      return
    }
    
    setPasswordLoading(true)
    setPasswordMessage('')
    
    try {
      // Ensin tarkista nykyinen salasana
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      })
      
      if (signInError) {
        setPasswordMessage(t('settings.password.currentWrong'))
        return
      }
      
      // Jos nykyinen salasana on oikein, vaihda salasana
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) {
        setPasswordMessage(`${t('settings.common.error')}: ${error.message}`)
      } else {
        setPasswordMessage(t('settings.password.changed'))
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordChange(false)
      }
    } catch (error) {
      setPasswordMessage(`${t('settings.common.error')}: ${error.message}`)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handlePasswordCancel = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setShowPasswordChange(false)
    setPasswordMessage('')
  }

  const handleEmailChangeInput = (e) => {
    const { name, value } = e.target
    setEmailData(prev => ({ ...prev, [name]: value }))
  }

  const isValidEmail = (value) => {
    return /[^@\s]+@[^@\s]+\.[^@\s]+/.test(value)
  }

  const handleEmailSave = async () => {
    if (!user) return
    if (emailData.newEmail !== emailData.confirmEmail) {
      setEmailMessage(t('settings.email.mismatch'))
      return
    }
    if (!isValidEmail(emailData.newEmail)) {
      setEmailMessage(t('settings.email.invalid'))
      return
    }
    setEmailLoading(true)
    setEmailMessage('')
    try {
      const { error } = await supabase.auth.updateUser(
        { email: emailData.newEmail },
        { emailRedirectTo: `${window.location.origin}/auth/callback` }
      )
      if (error) {
        setEmailMessage(`${t('settings.common.error')}: ${error.message}`)
      } else {
        setEmailMessage(t('settings.email.changed'))
        setShowEmailChange(false)
        setEmailData({ newEmail: '', confirmEmail: '' })
      }
    } catch (err) {
      setEmailMessage(`${t('settings.common.error')}: ${err.message}`)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleEmailCancel = () => {
    setEmailData({ newEmail: '', confirmEmail: '' })
    setShowEmailChange(false)
    setEmailMessage('')
  }

  return (
    <>
      <div className={styles['settings-container']}>
        <div className={styles['settings-header']}>
          <h2 className={styles['page-title']}>{t('settings.title')}</h2>
        </div>
        <div className={styles['settings-bentogrid']}>
          {/* Vasen sarake: Käyttäjätiedot */}
          <div className={styles.card}>
            {profileLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '16px', color: '#6b7280' }}>{t('settings.profile.loading')}</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{t('settings.profile.title')}</h2>
                  {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className={`${styles.btn} ${styles.btnSecondary}`}>
                      {t('settings.buttons.edit')}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSave} disabled={loading} className={`${styles.btn} ${styles.btnPrimary}`}>
                        {loading ? t('settings.buttons.saving') : t('settings.buttons.save')}
                      </button>
                      <button onClick={handleCancel} className={`${styles.btn} ${styles.btnNeutral}`}>
                        {t('settings.buttons.cancel')}
                      </button>
                    </div>
                  )}
                </div>
            
                {message && (
                  <div className={`${styles.message} ${message.includes(t('settings.common.error')) ? styles.messageError : styles.messageSuccess}`}>
                    {message}
                  </div>
                )}

                <div className={styles['form-group']}>
                  <label>{t('settings.fields.name')}</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="contact_person"
                      value={formData.contact_person} 
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      placeholder={t('settings.fields.namePlaceholder')}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={name || t('settings.common.notSet')} 
                      readOnly 
                      className={`${styles['form-input']} ${styles.readonly}`} 
                    />
                  )}
                </div>
                
                <div className={styles['form-group']}>
                  <label>{t('settings.fields.email')}</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      name="contact_email"
                      value={formData.contact_email} 
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      placeholder={t('settings.fields.emailPlaceholder')}
                    />
                  ) : (
                    <input 
                      type="email" 
                      value={email || t('settings.common.notAvailable')} 
                      readOnly 
                      className={`${styles['form-input']} ${styles.readonly}`} 
                    />
                  )}
                </div>
                
                <div className={styles['form-group']}>
                  <label>{t('settings.fields.company')}</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="company_name"
                      value={formData.company_name} 
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      placeholder={t('settings.fields.companyPlaceholder')}
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={companyName || t('settings.common.notSet')} 
                      readOnly 
                      className={`${styles['form-input']} ${styles.readonly}`} 
                    />
                  )}
                </div>
                
                <div className={styles['form-group']}>
                  <label>{t('settings.fields.industry')}</label>
                  <input 
                    type="text" 
                    value={industry || t('settings.common.notSet')} 
                    readOnly 
                    className={`${styles['form-input']} ${styles.readonly}`} 
                  />
                </div>
                
                <div className={styles['form-group']}>
                  <label>{t('settings.fields.userId')}</label>
                  <input 
                    type="text" 
                    value={userProfile?.id || user?.id || t('settings.common.notAvailable')} 
                    readOnly 
                    className={`${styles['form-input']} ${styles.readonly}`} 
                    style={{fontFamily: 'monospace', fontSize: '12px'}} 
                  />
                </div>
                
                {/* Salasanan vaihto */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>{t('settings.password.title')}</h3>
                    {!showPasswordChange ? (
                      <button onClick={() => setShowPasswordChange(true)} className={`${styles.btn} ${styles.btnSecondary}`}>
                        {t('settings.buttons.changePassword')}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={handlePasswordSave} disabled={passwordLoading} className={`${styles.btn} ${styles.btnPrimary}`}>
                          {passwordLoading ? t('settings.password.saving') : t('settings.password.save')}
                        </button>
                        <button onClick={handlePasswordCancel} className={`${styles.btn} ${styles.btnNeutral}`}>
                          {t('settings.password.cancel')}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {passwordMessage && (
                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      marginBottom: '12px',
                      fontSize: '14px',
                      background: passwordMessage.includes('Virhe') ? '#fef2f2' : '#f0fdf4',
                      color: passwordMessage.includes('Virhe') ? '#dc2626' : '#16a34a',
                      border: `1px solid ${passwordMessage.includes('Virhe') ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {passwordMessage}
                    </div>
                  )}
                  
                  {showPasswordChange && (
                    <div>
                      <div className={styles['form-group']}>
                        <label>{t('settings.password.current')}</label>
                        <input 
                          type="password" 
                          name="currentPassword"
                          value={passwordData.currentPassword} 
                          onChange={handlePasswordChange}
                          className={styles['form-input']}
                          placeholder={t('settings.password.currentPlaceholder')}
                        />
                      </div>
                      
                      <div className={styles['form-group']}>
                        <label>{t('settings.password.new')}</label>
                        <input 
                          type="password" 
                          name="newPassword"
                          value={passwordData.newPassword} 
                          onChange={handlePasswordChange}
                          className={styles['form-input']}
                          placeholder={t('settings.password.newPlaceholder')}
                        />
                      </div>
                      
                      <div className={styles['form-group']}>
                        <label>{t('settings.password.confirm')}</label>
                        <input 
                          type="password" 
                          name="confirmPassword"
                          value={passwordData.confirmPassword} 
                          onChange={handlePasswordChange}
                          className={styles['form-input']}
                          placeholder={t('settings.password.confirmPlaceholder')}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sähköpostin vaihto */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>{t('settings.email.title')}</h3>
                    {!showEmailChange ? (
                      <button onClick={() => setShowEmailChange(true)} className={`${styles.btn} ${styles.btnSecondary}`}>
                        {t('settings.buttons.changeEmail')}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={handleEmailSave} disabled={emailLoading} className={`${styles.btn} ${styles.btnPrimary}`}>
                          {emailLoading ? t('settings.email.saving') : t('settings.email.save')}
                        </button>
                        <button onClick={handleEmailCancel} className={`${styles.btn} ${styles.btnNeutral}`}>
                          {t('settings.email.cancel')}
                        </button>
                      </div>
                    )}
                  </div>

                  {emailMessage && (
                    <div style={{ 
                      padding: '8px 12px', 
                      borderRadius: '6px', 
                      marginBottom: '12px',
                      fontSize: '14px',
                      background: emailMessage.includes('Virhe') ? '#fef2f2' : '#f0fdf4',
                      color: emailMessage.includes('Virhe') ? '#dc2626' : '#16a34a',
                      border: `1px solid ${emailMessage.includes('Virhe') ? '#fecaca' : '#bbf7d0'}`
                    }}>
                      {emailMessage}
                    </div>
                  )}

                  {showEmailChange && (
                    <div>
                      <div className={styles['form-group']}>
                        <label>{t('settings.email.new')}</label>
                        <input 
                          type="email" 
                          name="newEmail"
                          value={emailData.newEmail} 
                          onChange={handleEmailChangeInput}
                          className={styles['form-input']}
                          placeholder={t('settings.email.newPlaceholder')}
                        />
                      </div>
                      <div className={styles['form-group']}>
                        <label>{t('settings.email.confirm')}</label>
                        <input 
                          type="email" 
                          name="confirmEmail"
                          value={emailData.confirmEmail} 
                          onChange={handleEmailChangeInput}
                          className={styles['form-input']}
                          placeholder={t('settings.email.confirmPlaceholder')}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sessio-asetukset */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <TimeoutSettings />
                </div>
              </>
            )}
          </div>
          
          {/* Oikea sarake: Muut asetukset */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Sosiaalisen median yhdistäminen */}
            <div className={styles.card}>
              <SimpleSocialConnect />
            </div>
            
            {/* Avatar-kuvat */}
            <div className={styles.card}>
      
              <AvatarSectionMulti companyId={userProfile?.company_id || null} />
            </div>
            
            {/* Äänitiedostot */}
            <div className={styles.card}>
              <VoiceSection companyId={userProfile?.company_id || null} />
            </div>
            
            {/* Karuselli-mallit */}
            <div className={styles.card}>
              <CarouselTemplateSelector />
            </div>

            {/* DEBUG: Strategia-modal testausnappi */}
            {import.meta.env.MODE === 'development' && (
              <div className={styles.card} style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>🔧 Strategia Modal Debug</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                  Nykyinen status: <strong>{userStatus || 'ei tiedossa'}</strong>
                </p>
                <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <button
                    onClick={async () => {
                      console.log('=== DEBUG: Aloitetaan status-päivitys ===')
                      console.log('User ID:', user.id)
                      console.log('Current status:', userStatus)
                      
                      try {
                        // Päivitä status Pending:ksi
                        const { error, data } = await supabase
                          .from('users')
                          .update({ status: 'Pending' })
                          .eq('auth_user_id', user.id)
                          .select()
                        
                        console.log('Update result:', { error, data })
                        
                        if (error) {
                          console.error('Error updating status:', error)
                          alert('Virhe statuksen päivityksessä: ' + error.message)
                        } else {
                          console.log('Status päivitetty Pending:ksi')
                          // Odota hetki ja päivitä context
                          setTimeout(async () => {
                            await refreshUserStatus()
                            console.log('Context päivitetty')
                          }, 500)
                          alert('Status päivitetty! Tarkista konsoli.')
                        }
                      } catch (err) {
                        console.error('Error:', err)
                        alert('Virhe: ' + err.message)
                      }
                    }}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    1. Aseta status Pending
                  </button>
                  
                  <button
                    onClick={() => {
                      console.log('=== DEBUG: Pakotetaan modal auki ===')
                      // Avaa modal suoraan window-objektin kautta
                      const event = new CustomEvent('force-strategy-modal-open')
                      window.dispatchEvent(event)
                    }}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                  >
                    2. Pakota modal auki (debug)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 

// Moderni monikuvakomponentti Tailwindilla, hakee kuvat backendistä companyId:lla
function AvatarSectionMulti({ companyId }) {
  const { t } = useTranslation('common')
  const [images, setImages] = useState([]); // [{url, id}]
  const fileInputRef = React.useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apufunktio: poimi avatar-kuvat N8N/Airtable-rakenteesta
  function extractAvatarImages(apiData) {
    if (!Array.isArray(apiData)) {
      return [];
    }
    // Etsi kaikki Media[] url:t, käytä thumb/full/large jos löytyy
    const images = [];
    for (const record of apiData) {
      if (Array.isArray(record.Media)) {
        for (const media of record.Media) {
          let url = null;
          if (media.thumbnails?.full?.url) url = media.thumbnails.full.url;
          else if (media.thumbnails?.large?.url) url = media.thumbnails.large.url;
          else if (media.url) url = media.url;
          if (url) {
            images.push({ 
              url, 
              id: media.id || url, 
              variableId: record["Variable ID"] || record.id 
            });
          }
        }
      }
      if (images.length >= 4) break;
    }
    return images.slice(0, 4);
  }

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError('');
    fetch('/api/avatar-status.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId })
    })
      .then(res => res.json())
      .then(data => {
        // data voi olla array (Airtable/N8N), poimi Media[] url:t
        const extractedImages = extractAvatarImages(data);
        setImages(extractedImages);
      })
      .catch((error) => {
        console.error('AvatarSectionMulti: Virhe kuvien haussa:', error);
        setError(t('settings.avatar.fetchError'));
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  // Lisää uusi kuva (lähetä backendiin)
  const handleAddImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= 4) return;
    
    // Tarkista tiedoston koko (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Tiedosto on liian suuri. Maksimikoko avatar-kuville on 10MB.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Luo FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);
      
      // Lähetä kuva backendiin
      const res = await fetch('/api/avatar-upload.js', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        // Lisää kuva local stateen blob URL:lla
        const url = URL.createObjectURL(file);
        setImages((prev) => [...prev, { 
          url, 
          id: `local-${Date.now()}`,
          variableId: null // Tämä päivittyy kun avatar-status haetaan uudelleen
        }]);
        
        // Päivitä avatar-status hetken kuluttua
        setTimeout(() => {
          fetch('/api/avatar-status.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId })
          })
          .then(res => res.json())
          .then(data => {
            setImages(extractAvatarImages(data));
          })
          .catch(() => setError(t('settings.avatar.refreshError')));
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || t('settings.avatar.uploadError'));
      }
    } catch (e) {
      setError(t('settings.avatar.uploadError'));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // Poista kuva backendistä (avatar-delete)
  const [deletingAvatars, setDeletingAvatars] = useState(new Set())
  const [lastClickTime, setLastClickTime] = useState(0)
  
  const handleDeleteAvatar = async (avatarId) => {
    // Estetään useita klikkauksia samalle avatarille
    if (deletingAvatars.has(avatarId)) {
      return
    }
    
    // Debounce: estetään useita klikkauksia 500ms sisällä
    const now = Date.now()
    if (now - lastClickTime < 500) {
      return
    }
    setLastClickTime(now)
    
    setDeletingAvatars(prev => new Set(prev).add(avatarId))
    setError('')
    
    try {
      const res = await fetch('/api/avatar-delete.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, avatarId })
      })
      const data = await res.json()
      if (data.success) {
        setImages((prev) => prev.filter(img => img.id !== avatarId))
      } else {
        setError(data.error || t('settings.avatar.deleteError'))
      }
    } catch (e) {
      setError(t('settings.avatar.deleteError'))
    } finally {
      setDeletingAvatars(prev => {
        const newSet = new Set(prev)
        newSet.delete(avatarId)
        return newSet
      })
    }
  }

  // Poista kuva (vain local stateesta)
  const handleRemoveImage = (idx) => {
    setImages((prev) => {
      if (prev[idx]?.url?.startsWith('blob:')) URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const openFileDialog = () => {
    if (images.length < 4 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{t('settings.avatar.title')}</h2>
      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>{t('settings.avatar.loading')}</div>
      ) : (
        <div className={styles['avatar-grid']}>
          {[0, 1, 2, 3].map((slot) => {
            const img = images[slot];
            return img ? (
              <div
                key={img.id || slot}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  aspectRatio: '1',
                  width: '100%',
                  maxWidth: '120px',
                  height: 'auto'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
              >
                <img
                  src={img.url}
                  alt={`Avatar ${slot + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                />
                <button
                  type="button"
                  disabled={deletingAvatars.has(img.variableId)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: deletingAvatars.has(img.variableId) ? '#9ca3af' : '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px',
                    border: 'none',
                    cursor: deletingAvatars.has(img.variableId) ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s',
                    zIndex: 20,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (!deletingAvatars.has(img.variableId)) {
                      e.target.style.backgroundColor = '#b91c1c'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!deletingAvatars.has(img.variableId)) {
                      e.target.style.backgroundColor = '#dc2626'
                    }
                  }}
                  onClick={() => handleDeleteAvatar(img.variableId)}
                  aria-label={deletingAvatars.has(img.variableId) ? 'Poistetaan...' : 'Poista kuva'}
                >
                  {deletingAvatars.has(img.variableId) ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <div
                key={slot}
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  aspectRatio: '1',
                  width: '100%',
                  maxWidth: '120px',
                  height: 'auto',
                  border: '2px dashed #d1d5db',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.backgroundColor = '#eff6ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onClick={openFileDialog}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openFileDialog();
                }}
                role="button"
                aria-label={t('settings.avatar.addNewAria')}
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="#9ca3af"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  style={{ transition: 'stroke 0.2s' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span style={{ 
                  marginTop: '4px', 
                  color: '#6b7280', 
                  fontSize: '12px',
                  textAlign: 'center',
                  transition: 'color 0.2s'
                }}>
                  {t('settings.avatar.add')}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {/* Piilotettu file input */}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleAddImage}
        disabled={images.length >= 4}
      />
      {/* Info-teksti */}
      <div style={{ color: '#6b7280', fontSize: 11, marginTop: 8 }}>
        {t('settings.avatar.info', { count: images.length })}
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
} 

// Äänitiedostojen upload-komponentti
function VoiceSection({ companyId }) {
  const { t } = useTranslation('common')
  const [audioFiles, setAudioFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = React.useRef(null);

  // Apufunktio: poimi äänitiedostot N8N/Airtable-rakenteesta
  function extractAudioFiles(apiData) {
    if (!Array.isArray(apiData)) return [];
    
    // Etsi äänitiedostot Voice ID -kentästä
    const audioFiles = [];
    for (const record of apiData) {
      // Tarkista onko Voice ID -kenttää
      if (record['Voice ID']) {
        // Voice ID voi olla string tai array
        const voiceIds = Array.isArray(record['Voice ID']) ? record['Voice ID'] : [record['Voice ID']];
        
        for (const voiceId of voiceIds) {
          if (voiceId) {
            audioFiles.push({ 
              url: null, 
              id: voiceId, 
              filename: 'Voice Clone',
              fileType: 'audio',
              voiceId: record["Variable ID"] || record.id,
              isPlaceholder: true
            });
          }
        }
      }
      if (audioFiles.length >= 1) break; // Max 1 äänitiedosto
    }
    return audioFiles.slice(0, 1);
  }

  // Hae äänitiedostot N8N/Airtable-rakenteesta
  const fetchAudioFiles = async () => {
    if (!companyId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/avatar-status.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId })
      });
      
      if (res.ok) {
        const data = await res.json();
        const extractedAudioFiles = extractAudioFiles(data);
        setAudioFiles(extractedAudioFiles);
      } else {
        setError(t('settings.voice.fetchError'));
      }
    } catch (error) {
      setError(t('settings.voice.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  // Hae äänitiedostot kun komponentti latautuu
  useEffect(() => {
    fetchAudioFiles();
  }, [companyId]);

  // Lisää uusi äänitiedosto (lähetä backendiin)
  const handleAddAudio = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (audioFiles.length >= 1) return; // Max 1 äänitiedosto

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', companyId);

      const res = await fetch('/api/avatar-upload.js', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Odota että äänitiedosto ilmestyy N8N/Airtable-rakenteeseen
        setTimeout(() => {
          fetchAudioFiles();
        }, 3000); // 3 sekunnin viive
        
        // Näytä väliaikainen tila
        setAudioFiles([{
          id: `uploading-${Date.now()}`,
          filename: file.name,
          fileType: data.fileType,
          status: 'uploading'
        }]);
      } else {
        const errorData = await res.json();
        setError(errorData.error || t('settings.voice.uploadError'));
      }
    } catch (e) {
      setError(t('settings.voice.uploadError'));
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleReplaceAudio = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    // Poista vanha äänitiedosto ja lisää uusi
    setAudioFiles([]);
    
    handleAddAudio(e);
  };

  const openFileDialog = () => {
    if (audioFiles.length === 0 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>{t('settings.voice.title')}</h2>
      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>{t('settings.voice.loading')}</div>
      ) : (
        <div className={styles['avatar-grid']}>
          {[0].map((slot) => {
            const audio = audioFiles[slot];
            return audio ? (
              <div
                key={audio.id || slot}
                className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 bg-white transition hover:shadow-lg flex items-center justify-center aspect-square w-16 h-16 sm:w-20 sm:h-20 mx-auto"
              >
                {/* Äänitiedoston ikoni */}
                <div className="flex flex-col items-center justify-center w-full h-full p-2">
                  {audio.status === 'uploading' ? (
                    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
                  ) : audio.isPlaceholder ? (
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                                      ) : (
                      <svg
                        className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  )}
                  <span className="text-xs text-gray-600 mt-1 text-center truncate w-full">
                    {audio.filename}
                  </span>
                  <span className={`text-xs mt-1 text-center ${audio.isPlaceholder ? 'text-green-600' : 'text-green-600'}`}>
                    {audio.status === 'uploading' ? t('settings.voice.processing') : t('settings.voice.added')}
                  </span>
                </div>

              </div>
            ) : (
              <div
                key={slot}
                className="bg-gray-100 rounded-xl flex flex-col items-center justify-center aspect-square w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition group relative mx-auto"
                onClick={openFileDialog}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openFileDialog();
                }}
                role="button"
                aria-label={t('settings.voice.addNewAria')}
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-blue-500 transition"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="mt-1 text-gray-500 text-xs group-hover:text-blue-500 transition text-center">
                  {t('settings.voice.add')}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {/* Piilotettu file input */}
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleAddAudio}
        disabled={audioFiles.length >= 1}
      />
      {/* Info-teksti */}
      <div style={{ color: '#6b7280', fontSize: 11, marginTop: 8 }}>
        {audioFiles.length === 0
          ? t('settings.voice.infoNone', { count: audioFiles.length })
          : t('settings.voice.infoSome', { count: audioFiles.length })}
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
} 