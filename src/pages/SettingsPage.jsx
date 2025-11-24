import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import CarouselTemplateSelector from '../components/CarouselTemplateSelector'
import SocialMediaConnect from '../components/SocialMediaConnect'
import TimeoutSettings from '../components/TimeoutSettings'
import SimpleSocialConnect from '../components/SimpleSocialConnect'
import { useMixpostIntegration } from '../components/SocialMedia/hooks/useMixpostIntegration'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import SettingsIntegrationsTab from '../components/SettingsIntegrationsTab'

import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user, organization } = useAuth()
  const { t } = useTranslation('common')
  const { refreshUserStatus, userStatus } = useStrategyStatus()
  const [searchParams, setSearchParams] = useSearchParams()
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
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoMessage, setLogoMessage] = useState('')
  const [logoDragActive, setLogoDragActive] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  
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

    // Hae organisaation ID
    let orgUserId = null
    if (organization?.id) {
      orgUserId = organization.id
    } else {
      orgUserId = await getUserOrgId(user.id)
    }
    
    if (!orgUserId) {
      console.error('Organisaation ID puuttuu, ei voida synkronoida sometilejä')
      return
    }

    setSyncInProgress(true)
    try {
      console.log('🔄 Synkronoidaan sometilejä Supabaseen...')
      
      // Hae olemassa olevat tilit Supabasesta
      const { data: existingAccounts } = await supabase
        .from('user_social_accounts')
        .select('id, mixpost_account_uuid, provider')
        .eq('user_id', orgUserId)

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
      // HUOM: Älä poista tilejä joiden account_data sisältää "blotato"
      const accountsToRemove = existingAccounts?.filter(account => {
        const accountKey = `${account.provider}:${account.mixpost_account_uuid}`
        const notInMixpost = !mixpostAccountsSet.has(accountKey)
        
        // Jos tili löytyy Mixpostista, ei poisteta
        if (!notInMixpost) return false
        
        // Jos account_data sisältää "blotato", ei poisteta
        const accountDataStr = typeof account.account_data === 'string' 
          ? account.account_data 
          : JSON.stringify(account.account_data || {})
        
        if (accountDataStr.toLowerCase().includes('blotato')) {
          console.log(`🔒 Tiliä ${account.account_name} (${account.provider}) ei poisteta, koska se sisältää "blotato"`)
          return false
        }
        
        return true
      }) || []

      // Lisää uudet tilit Supabaseen
      if (newAccounts.length > 0) {
        console.log(`📝 Lisätään ${newAccounts.length} uutta tiliä Supabaseen`)
        
        // Hae käyttäjän auth ID
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        const accountsToInsert = newAccounts.map(account => ({
          user_id: orgUserId,
          mixpost_account_uuid: account.id,
          provider: account.provider,
          account_name: account.name || account.username,
          username: account.username,
          profile_image_url: account.profile_image_url || account.image || account.picture,
          is_authorized: true,
          visibility: 'public', // Oletuksena public (organisaation sisäinen)
          created_by: authUser?.id || null, // Tallenna kuka loi tilin
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
        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)
        
        if (!userId) {
          console.error('Error: User ID not found')
          setMessage(t('settings.profile.notFoundSupport'))
          setProfileLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
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

  // Tarkista onko käyttäjä tullut takaisin vahvistuslinkistä
  useEffect(() => {
    const emailChanged = searchParams.get('email')
    if (emailChanged === 'changed') {
      setEmailMessage('Sähköpostiosoite vaihdettu onnistuneesti!')
      setShowEmailChange(false)
      setEmailData({ newEmail: '', confirmEmail: '' })
      // Poista parametri URL:sta
      setSearchParams({}, { replace: true })
      // Päivitä käyttäjätiedot - hae uudet tiedot
      const refreshUserData = async () => {
        if (user?.id) {
          try {
            // Hae uusi sähköpostiosoite Supabase Authista
            const { data: authData, error: authError } = await supabase.auth.getUser()
            if (authError) {
              console.error('Error fetching auth user:', authError)
              return
            }
            
            if (authData?.user?.email) {
              const newEmail = authData.user.email
              console.log('Email changed successfully:', newEmail)
              
              // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
              const userId = await getUserOrgId(user.id)
              
              if (userId) {
                // Päivitä users.contact_email kenttä uuteen sähköpostiosoitteeseen
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ 
                    contact_email: newEmail,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userId)
                
                if (updateError) {
                  console.error('Error updating contact_email:', updateError)
                }
              }
            }
            
            // Päivitä käyttäjäprofiili
            const userId = await getUserOrgId(user.id)
            if (userId) {
              const { data: profileData, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()
              
              if (profileError) {
                console.error('Error fetching user profile:', profileError)
              } else if (profileData) {
                setUserProfile(profileData)
              }
            }
          } catch (error) {
            console.error('Error refreshing user data:', error)
          }
        }
      }
      refreshUserData()
    }
  }, [searchParams, setSearchParams, user?.id])

  // Käyttäjätiedot public.users taulusta
  // Kutsutut käyttäjät näkevät vain henkilökohtaiset tiedot (sähköposti)
  // Organisaation tiedot näytetään erikseen
  const isInvitedUser = organization && organization.role !== 'owner'
  const email = isInvitedUser ? (user?.email || null) : (userProfile?.contact_email || user?.email || null)
  const name = isInvitedUser ? null : (userProfile?.contact_person || null)
  const companyName = isInvitedUser ? (organization?.data?.company_name || null) : (userProfile?.company_name || null)
  const industry = isInvitedUser ? (organization?.data?.industry || null) : (userProfile?.industry || null)

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

  // Logo-tiedoston validointi ja käsittely
  const validateAndSetLogoFile = (file) => {
    if (!file) return false

    // Tarkista tiedostotyyppi
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      setLogoMessage('Sallitut tiedostotyypit: PNG, JPG, WEBP, SVG')
      return false
    }

    // Tarkista tiedostokoko (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setLogoMessage('Tiedosto on liian suuri. Maksimikoko on 2MB.')
      return false
    }

    setLogoFile(file)
    setLogoMessage('')

    // Luo esikatselu
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result)
    }
    reader.readAsDataURL(file)
    return true
  }

  // Logo-tiedoston käsittely input-kentästä
  const handleLogoFileChange = (e) => {
    const file = e.target.files?.[0]
    validateAndSetLogoFile(file)
  }

  // Drag & Drop -käsittelijät
  const handleLogoDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setLogoDragActive(true)
    } else if (e.type === "dragleave") {
      setLogoDragActive(false)
    }
  }

  const handleLogoDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLogoDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSetLogoFile(file)
    }
  }

  // Lataa logo Supabase Storageen
  const handleLogoUpload = async () => {
    if (!logoFile || !user?.id) return

    setLogoUploading(true)
    setLogoMessage('')

    try {
      // Luo uniikki tiedostonimi
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${user.id}/logo.${fileExt}`

      // Lataa tiedosto Supabase Storageen
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-logos')
        .upload(fileName, logoFile, {
          upsert: true, // Korvaa vanha jos on olemassa
          contentType: logoFile.type
        })

      if (uploadError) throw uploadError

      // Hae julkinen URL
      const { data: urlData } = supabase.storage
        .from('user-logos')
        .getPublicUrl(fileName)

      const logoUrl = urlData.publicUrl

      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        throw new Error('Käyttäjää ei löytynyt')
      }

      // Päivitä users-tauluun
      const { error: updateError } = await supabase
        .from('users')
        .update({ logo_url: logoUrl, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) throw updateError

      setLogoMessage('Logo päivitetty onnistuneesti!')
      setLogoFile(null)
      setLogoPreview(null)

      // Päivitä käyttäjäprofiili
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (updatedUser) {
        setUserProfile(updatedUser)
      }

      // Päivitä sivu jotta logo näkyy sidebarissa
      window.location.reload()

    } catch (error) {
      console.error('Logo upload error:', error)
      setLogoMessage(`Virhe: ${error.message}`)
    } finally {
      setLogoUploading(false)
    }
  }

  // Poista logo
  const handleLogoRemove = async () => {
    if (!user?.id) return

    setLogoUploading(true)
    setLogoMessage('')

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        throw new Error('Käyttäjää ei löytynyt')
      }

      // Päivitä users-tauluun
      const { error: updateError } = await supabase
        .from('users')
        .update({ logo_url: null, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) throw updateError

      setLogoMessage('Logo poistettu onnistuneesti!')
      setLogoFile(null)
      setLogoPreview(null)

      // Päivitä käyttäjäprofiili
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (updatedUser) {
        setUserProfile(updatedUser)
      }

      // Päivitä sivu jotta muutos näkyy sidebarissa
      window.location.reload()

    } catch (error) {
      console.error('Logo remove error:', error)
      setLogoMessage(`Virhe: ${error.message}`)
    } finally {
      setLogoUploading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.id) return
    
    // Kutsutut käyttäjät eivät voi muokata organisaation tietoja
    if (isInvitedUser) {
      setMessage('Kutsutut käyttäjät eivät voi muokata organisaation tietoja')
      setIsEditing(false)
      return
    }
    
    if (!userProfile?.id) return
    
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
    
    // Validoi sähköpostit
    if (emailData.newEmail !== emailData.confirmEmail) {
      setEmailMessage(t('settings.email.mismatch'))
      return
    }
    
    if (!isValidEmail(emailData.newEmail)) {
      setEmailMessage(t('settings.email.invalid'))
      return
    }
    
    // Tarkista ettei uusi sähköposti ole sama kuin nykyinen
    if (emailData.newEmail === user.email) {
      setEmailMessage('Uusi sähköpostiosoite on sama kuin nykyinen')
      return
    }
    
    setEmailLoading(true)
    setEmailMessage('')
    
    try {
      // Supabase lähettää vahvistuslinkin uuteen sähköpostiin
      const { data, error } = await supabase.auth.updateUser(
        { email: emailData.newEmail },
        { 
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      )
      
      if (error) {
        console.error('Email change error:', error)
        setEmailMessage(`Virhe: ${error.message}`)
      } else {
        // Onnistui - vahvistuslinkki lähetetään uuteen sähköpostiin
        setEmailMessage(`Vahvistuslinkki lähetetty sähköpostiosoitteeseen ${emailData.newEmail}. Vahvista sähköpostiosoitteesi klikkaamalla linkkiä sähköpostissa.`)
        // Tyhjennä lomakkeen kentät, mutta jätä lomake näkyviin jotta käyttäjä näkee viestin
        setEmailData({ newEmail: '', confirmEmail: '' })
      }
    } catch (err) {
      console.error('Email change exception:', err)
      setEmailMessage(`Virhe: ${err.message}`)
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
        
        {/* Tab-napit */}
        <div className={styles['settings-tabs']}>
          <button
            className={`${styles['settings-tab']} ${activeTab === 'profile' ? styles['settings-tab-active'] : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profiili
          </button>
          <button
            className={`${styles['settings-tab']} ${activeTab === 'features' ? styles['settings-tab-active'] : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Ominaisuudet
          </button>
        </div>
        
        {/* Profiili-tab */}
        {activeTab === 'profile' && (
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
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>
                    {isInvitedUser ? 'Henkilökohtaiset tiedot' : t('settings.profile.title')}
                  </h2>
                  {!isInvitedUser && !isEditing ? (
                    <button onClick={() => setIsEditing(true)} className={`${styles.btn} ${styles.btnSecondary}`}>
                      {t('settings.buttons.edit')}
                    </button>
                  ) : !isInvitedUser && isEditing ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSave} disabled={loading} className={`${styles.btn} ${styles.btnPrimary}`}>
                        {loading ? t('settings.buttons.saving') : t('settings.buttons.save')}
                      </button>
                      <button onClick={handleCancel} className={`${styles.btn} ${styles.btnNeutral}`}>
                        {t('settings.buttons.cancel')}
                      </button>
                    </div>
                  ) : null}
                </div>
                
                {isInvitedUser && (
                  <div style={{ 
                    marginBottom: 16, 
                    padding: 12, 
                    backgroundColor: '#f0f9ff', 
                    border: '1px solid #bae6fd', 
                    borderRadius: 8,
                    fontSize: 14,
                    color: '#0369a1'
                  }}>
                    <strong>Organisaatio:</strong> {organization?.data?.company_name || 'Ei nimeä'}
                    <br />
                    <strong>Rooli:</strong> {organization?.role === 'admin' ? 'Admin' : organization?.role === 'member' ? 'Jäsen' : 'Omistaja'}
                  </div>
                )}
            
                {message && (
                  <div className={`${styles.message} ${message.includes(t('settings.common.error')) ? styles.messageError : styles.messageSuccess}`}>
                    {message}
                  </div>
                )}

                {!isInvitedUser && (
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
                )}
                
                <div className={styles['form-group']}>
                  <label>{t('settings.fields.email')}</label>
                  {isInvitedUser ? (
                    <input 
                      type="email" 
                      value={email || t('settings.common.notAvailable')} 
                      readOnly 
                      className={`${styles['form-input']} ${styles.readonly}`} 
                    />
                  ) : isEditing ? (
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
                
                {!isInvitedUser && (
                  <>
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
                  </>
                )}
                
                {/* Logo-lataus - vain omistajille */}
                {!isInvitedUser && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '16px' }}>Yrityksen Logo</h3>
                  
                  {/* Nykyinen logo */}
                  {userProfile?.logo_url && !logoPreview && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', display: 'block' }}>Nykyinen logo:</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={userProfile.logo_url} 
                          alt="Company Logo" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <button 
                          onClick={handleLogoRemove} 
                          disabled={logoUploading}
                          className={`${styles.btn} ${styles.btnNeutral}`}
                          style={{ fontSize: '13px' }}
                        >
                          {logoUploading ? 'Poistetaan...' : 'Poista logo'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Drag & Drop alue */}
                  <div 
                    className={styles['logo-drop-zone']}
                    onDragEnter={handleLogoDrag}
                    onDragLeave={handleLogoDrag}
                    onDragOver={handleLogoDrag}
                    onDrop={handleLogoDrop}
                    style={{
                      border: logoDragActive ? '2px dashed #ff6600' : '2px dashed #d1d5db',
                      background: logoDragActive ? 'rgba(255, 102, 0, 0.05)' : '#f9fafb',
                      borderRadius: '12px',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      marginBottom: '16px'
                    }}
                  >
                    {logoPreview ? (
                      <div>
                        <img 
                          src={logoPreview} 
                          alt="Logo Preview" 
                          style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '2px solid #e5e7eb', marginBottom: '16px' }}
                        />
                        <p style={{ fontSize: '14px', color: '#374151', fontWeight: 500, marginBottom: '8px' }}>
                          Logo valittu!
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <button 
                            onClick={handleLogoUpload}
                            disabled={logoUploading}
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ fontSize: '13px' }}
                          >
                            {logoUploading ? 'Ladataan...' : '✓ Tallenna logo'}
                          </button>
                          <button 
                            onClick={() => {
                              setLogoFile(null)
                              setLogoPreview(null)
                              setLogoMessage('')
                            }}
                            className={`${styles.btn} ${styles.btnNeutral}`}
                            style={{ fontSize: '13px' }}
                          >
                            Peruuta
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ 
                          width: '64px', 
                          height: '64px', 
                          margin: '0 auto 16px', 
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.1) 0%, rgba(229, 94, 0, 0.1) 100%)',
                          border: '2px solid rgba(255, 102, 0, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M17 8l-5-5-5 5" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 3v12" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <p style={{ fontSize: '14px', color: '#374151', fontWeight: 500, marginBottom: '8px' }}>
                          {logoDragActive ? 'Pudota logo tähän' : 'Vedä logo tähän'}
                        </p>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                          tai
                        </p>
                        <label className={`${styles.btn} ${styles.btnSecondary}`} style={{ fontSize: '13px', cursor: 'pointer' }}>
                          Valitse tiedosto
                          <input 
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                            onChange={handleLogoFileChange}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
                          PNG, JPG, WEBP, SVG (max 2MB)
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {logoMessage && (
                    <p style={{ 
                      marginTop: '8px', 
                      fontSize: '13px', 
                      color: logoMessage.includes('Virhe') || logoMessage.includes('liian') || logoMessage.includes('Sallitut') ? '#dc2626' : '#16a34a',
                      textAlign: 'center'
                    }}>
                      {logoMessage}
                    </p>
                  )}
                </div>
                )}
                
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
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      marginBottom: '12px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      background: emailMessage.includes('Virhe') || emailMessage.includes('sama kuin') ? '#fef2f2' : emailMessage.includes('Vahvistuslinkki') ? '#eff6ff' : '#f0fdf4',
                      color: emailMessage.includes('Virhe') || emailMessage.includes('sama kuin') ? '#dc2626' : emailMessage.includes('Vahvistuslinkki') ? '#1e40af' : '#16a34a',
                      border: `1px solid ${emailMessage.includes('Virhe') || emailMessage.includes('sama kuin') ? '#fecaca' : emailMessage.includes('Vahvistuslinkki') ? '#bfdbfe' : '#bbf7d0'}`
                    }}>
                      {emailMessage.includes('Vahvistuslinkki') ? (
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            Vahvistuslinkki lähetetty
                          </div>
                          <div style={{ fontSize: '13px', marginTop: '8px' }}>
                            {emailMessage.split('.')[1]?.trim()}
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '8px', color: '#64748b', fontStyle: 'italic' }}>
                            Tarkista myös roskapostikansio. Sähköpostiosoitteesi vaihdetaan vasta kun klikkaat vahvistuslinkkiä sähköpostissa.
                          </div>
                        </div>
                      ) : (
                        emailMessage
                      )}
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
            
            {/* Sosiaalisen median yhdistäminen - vain owner/admin */}
            {organization?.role !== 'member' && (
              <div className={styles.card}>
                <SimpleSocialConnect />
              </div>
            )}
            
            {/* Avatar ja Ääniklooni */}
            <div className={styles.card}>
              <div className={styles['avatar-voice-grid']}>
                {/* Avatar-kuvat */}
                <div className={styles['avatar-voice-section']}>
                  <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Avatar</h2>
                  <div style={{ 
                    padding: '32px', 
                    textAlign: 'center', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                    borderRadius: '12px',
                    border: '2px dashed #cbd5e1',
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    {/* Dekoratiivinen gradient */}
                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      right: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Sisältö */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <svg 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2"
                        style={{ margin: '0 auto 16px', display: 'block' }}
                      >
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <div style={{ 
                        color: '#334155',
                        fontSize: '16px',
                        fontWeight: 600,
                        marginBottom: '8px'
                      }}>
                        Tulossa uusi versio
                      </div>
                      <div style={{ 
                        color: '#64748b',
                        fontSize: '13px',
                        lineHeight: '1.5'
                      }}>
                        Työskentelemme parhaillaan uuden<br/>avatar-toiminnallisuuden parissa
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Ääniklooni */}
                <div className={styles['avatar-voice-section']}>
                  <VoiceSection companyId={userProfile?.company_id || null} />
                </div>
              </div>
            </div>
            
            {/* Karuselli-mallit */}
            <div className={styles.card}>
              <CarouselTemplateSelector />
            </div>
          </div>
          </div>
        )}
        
            {/* Ominaisuudet-tab */}
            {activeTab === 'features' && (
              <div className={styles['settings-bentogrid']}>
                <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
                  <SettingsIntegrationsTab />
                </div>
              </div>
            )}
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

  // Tarkista onko ääni löytynyt (placeholder tai oikea)
  const hasAudio = audioFiles.length > 0;
  
  return (
    <div>
      <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Ääniklooni</h2>
      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>{t('settings.voice.loading')}</div>
      ) : hasAudio ? (
        // Ääni löytyi - näytä samanlainen laatikko kuin Avatar-kohdassa
        <div style={{ 
          padding: '32px', 
          textAlign: 'center', 
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
          borderRadius: '12px',
          border: '2px dashed #cbd5e1',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Dekoratiivinen gradient */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          {/* Sisältö */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Mikrofonikuvake */}
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="2"
              style={{ margin: '0 auto 16px', display: 'block' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <div style={{ 
              color: '#334155',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              Ääni kloonattu
            </div>
            <div style={{ 
              color: '#64748b',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              Äänikloonisi on valmis käyttöön
            </div>
          </div>
        </div>
      ) : (
        // Ääntä ei löydy - näytä "Lisää tiedosto" -laatikko
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderRadius: '12px',
            border: '2px dashed #cbd5e1',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.2s',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
          onClick={openFileDialog}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.background = 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.background = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") openFileDialog();
          }}
          role="button"
          aria-label={t('settings.voice.addNewAria')}
        >
          {/* Dekoratiivinen gradient */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          
          {/* Sisältö */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#9ca3af" 
              strokeWidth="2"
              style={{ margin: '0 auto 16px', display: 'block' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <div style={{ 
              color: '#334155',
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px'
            }}>
              Lisää äänitiedosto
            </div>
            <div style={{ 
              color: '#64748b',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              Valitse tiedosto tai vedä se tähän
            </div>
          </div>
        </div>
      )}
      {/* Piilotettu file input */}
      <input
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleAddAudio}
        disabled={audioFiles.length >= 1}
      />
      {/* Info-teksti - näytetään vain jos ei ole ääntä */}
      {audioFiles.length === 0 && (
        <div style={{ color: '#6b7280', fontSize: 11, marginTop: 8 }}>
          {t('settings.voice.infoNone', { count: audioFiles.length })}
        </div>
      )}
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
} 