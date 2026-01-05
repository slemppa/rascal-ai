import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import CarouselTemplateSelector from '../components/CarouselTemplateSelector'
import PlacidTemplatesList from '../components/PlacidTemplatesList'
import SocialMediaConnect from '../components/SocialMediaConnect'
import TimeoutSettings from '../components/TimeoutSettings'
import SimpleSocialConnect from '../components/SimpleSocialConnect'
import { useMixpostIntegration } from '../components/SocialMedia/hooks/useMixpostIntegration'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import SettingsIntegrationsTab from '../components/SettingsIntegrationsTab'
import VoiceSection from '../components/settings/VoiceSection'
import AccountTypeSection from '../components/settings/AccountTypeSection'

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
  const [showUserId, setShowUserId] = useState(false)
  
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
        
        // TODO: Korvaa magic string tarkistus tietokannasta tulevalla boolean-kentällä
        // Tarkista onko tili merkitty sisäiseksi testitiliksi
        // Jos tietokannassa on is_internal_test_account tai vastaava kenttä, käytä sitä:
        // if (account.is_internal_test_account === true) return false
        // 
        // Toistaiseksi käytetään turvallisempaa tapaa: tarkistetaan account_data-kentästä
        // mutta ilman magic stringiä. Jos tarvitaan suojattuja tilejä, lisää ne tietokantaan
        // boolean-kenttänä (esim. is_protected tai is_internal_test_account)
        const accountDataStr = typeof account.account_data === 'string' 
          ? account.account_data 
          : JSON.stringify(account.account_data || {})
        
        // TODO: Poista tämä magic string -tarkistus kun tietokantaan on lisätty
        // is_internal_test_account tai vastaava boolean-kenttä
        if (accountDataStr.toLowerCase().includes('blotato')) {
          console.log(`🔒 Tiliä ${account.account_name} (${account.provider}) ei poisteta, koska se on merkitty suojatuksi`)
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
    contact_email: email || '',
    industry: industry || ''
  })

  useEffect(() => {
    setFormData({
      contact_person: name || '',
      company_name: companyName || '',
      contact_email: email || '',
      industry: industry || ''
    })
  }, [name, companyName, email, industry])

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
          industry: formData.industry || null,
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
      contact_email: email || '',
      industry: industry || ''
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
            className={`${styles['settings-tab']} ${activeTab === 'avatar' ? styles['settings-tab-active'] : ''}`}
            onClick={() => setActiveTab('avatar')}
          >
            Avatar & Ääni
          </button>
          <button
            className={`${styles['settings-tab']} ${activeTab === 'carousel' ? styles['settings-tab-active'] : ''}`}
            onClick={() => setActiveTab('carousel')}
          >
            Karusellit
          </button>
          <button
            className={`${styles['settings-tab']} ${activeTab === 'features' ? styles['settings-tab-active'] : ''}`}
            onClick={() => setActiveTab('features')}
          >
            Ominaisuudet
          </button>
          <button
            className={`${styles['settings-tab']} ${activeTab === 'security' ? styles['settings-tab-active'] : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Turvallisuus
          </button>
        </div>
        
        {/* Profiili-tab */}
        {activeTab === 'profile' && (
          <div className={styles['settings-bentogrid']}>
            {/* Vasen sarake: Loogisesti jaettu kortteihin */}
            {profileLoading ? (
              <div className={styles.card}>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '16px', color: '#6b7280' }}>{t('settings.profile.loading')}</div>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Yrityksen Logo -kortti (vasemmalla ylhäällä) */}
                {!isInvitedUser && (
                <div className={`${styles.card} ${styles.cardNoPadding}`} style={{ gridColumn: '1', gridRow: '1' }}>
                  <div className={styles.cardHeader}>
                    <h3>Yrityksen Logo</h3>
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.logoContainer}>
                      {/* Nykyinen logo */}
                      {userProfile?.logo_url && !logoPreview && (
                        <div className={styles.currentLogoSection}>
                          <p className={styles.currentLogoLabel}>Nykyinen logo:</p>
                          <img 
                            src={userProfile.logo_url} 
                            alt="Company Logo" 
                            className={styles.currentLogoImage}
                          />
                          <button 
                            onClick={handleLogoRemove} 
                            disabled={logoUploading}
                            className={`${styles.btn} ${styles.btnNeutral}`}
                          >
                            {logoUploading ? 'Poistetaan...' : 'Poista logo'}
                          </button>
                        </div>
                      )}
                      
                      {/* Drag & Drop alue */}
                      <div 
                        className={`${styles['logo-drop-zone']} ${logoDragActive ? styles.active : ''}`}
                        onDragEnter={handleLogoDrag}
                        onDragLeave={handleLogoDrag}
                        onDragOver={handleLogoDrag}
                        onDrop={handleLogoDrop}
                        style={{
                          borderColor: logoDragActive ? '#ff6600' : '#d1d5db',
                          background: logoDragActive ? 'rgba(255, 102, 0, 0.05)' : '#f9fafb'
                        }}
                      >
                      {logoPreview ? (
                        <div className={styles.logoPreviewSection}>
                          <img 
                            src={logoPreview} 
                            alt="Logo Preview" 
                            className={styles.logoPreviewImage}
                          />
                          <p className={styles.logoPreviewText}>
                            Logo valittu!
                          </p>
                          <div className={styles.logoPreviewActions}>
                            <button 
                              onClick={handleLogoUpload}
                              disabled={logoUploading}
                              className={`${styles.btn} ${styles.btnPrimary}`}
                            >
                              {logoUploading ? 'Ladataan...' : '✓ Tallenna'}
                            </button>
                            <button 
                              onClick={() => {
                                setLogoFile(null)
                                setLogoPreview(null)
                                setLogoMessage('')
                              }}
                              className={`${styles.btn} ${styles.btnNeutral}`}
                            >
                              Peruuta
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.uploadIconWrapper}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M17 8l-5-5-5 5" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 3v12" stroke="#ff6600" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <p className={styles.uploadText}>
                            {logoDragActive ? 'Pudota logo tähän' : 'Vedä logo tähän'}
                          </p>
                          <p className={styles.uploadSubtext}>
                            tai
                          </p>
                          <label className={`${styles.btn} ${styles.btnSecondary}`}>
                            Valitse tiedosto
                            <input 
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                              onChange={handleLogoFileChange}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </>
                      )}
                      </div>
                    </div>
                    
                    {logoMessage && (
                      <p className={`${styles.logoMessage} ${
                        logoMessage.includes('Virhe') || logoMessage.includes('liian') || logoMessage.includes('Sallitut') 
                          ? styles.logoMessageError 
                          : styles.logoMessageSuccess
                      }`}>
                        {logoMessage}
                      </p>
                    )}
                  </div>
                </div>
                )}

                {/* 2. Käyttäjätiedot -kortti (vasemmalla logon alle) */}
                <div className={`${styles.card} ${styles.cardNoPadding}`} style={{ gridColumn: '1', gridRow: '2' }}>
                  <div className={styles.cardHeader}>
                    <h3>{isInvitedUser ? 'Henkilökohtaiset tiedot' : t('settings.profile.title')}</h3>
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
                  
                  <div className={styles.cardContent}>
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
                          <input 
                            type="text" 
                            value={companyName || t('settings.common.notSet')} 
                            readOnly 
                            className={`${styles['form-input']} ${styles.readonly}`} 
                          />
                        </div>
                        
                        <div className={styles['form-group']}>
                          <label>{t('settings.fields.industry')}</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              name="industry"
                              value={formData.industry} 
                              onChange={handleInputChange}
                              className={styles['form-input']}
                              placeholder={t('settings.fields.industry')}
                            />
                          ) : (
                            <input 
                              type="text" 
                              value={industry || t('settings.common.notSet')} 
                              readOnly 
                              className={`${styles['form-input']} ${styles.readonly}`} 
                            />
                          )}
                        </div>
                        
                        <div className={styles['form-group']}>
                          <label>{t('settings.fields.userId')}</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                              type={showUserId ? "text" : "password"} 
                              value={userProfile?.id || user?.id || t('settings.common.notAvailable')} 
                              readOnly 
                              className={`${styles['form-input']} ${styles.readonly}`} 
                              style={{fontFamily: 'monospace', fontSize: '12px', flex: 1}} 
                            />
                            <button
                              type="button"
                              onClick={() => setShowUserId(!showUserId)}
                              className={`${styles.btn} ${styles.btnNeutral}`}
                              style={{ fontSize: '13px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                            >
                              {showUserId ? 'Piilota' : 'Näytä'}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Oikea sarake: Account-asetukset */}
                {!isInvitedUser && (
                  <div style={{ gridColumn: '2', gridRow: '1 / 3', alignSelf: 'start' }}>
                    <AccountTypeSection 
                      userProfile={userProfile}
                      onProfileUpdate={(updatedProfile) => setUserProfile(updatedProfile)}
                      isInvitedUser={isInvitedUser}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Avatar & Ääni-tab */}
        {activeTab === 'avatar' && (
          <div className={styles['settings-bentogrid']}>
            <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
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
          </div>
        )}
        
        {/* Karusellit-tab */}
        {activeTab === 'carousel' && (
          <div className={styles['settings-bentogrid']}>
            <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
              <CarouselTemplateSelector />
              <PlacidTemplatesList />
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

        {/* Turvallisuus-tab */}
        {activeTab === 'security' && (
          <div className={styles['settings-bentogrid']}>
            {/* Turvallisuus -kortti (Salasana ja Sähköposti) */}
            <div className={`${styles.card} ${styles.cardNoPadding}`}>
              <div className={styles.cardHeader}>
                <h3>Turvallisuus</h3>
              </div>
              <div className={styles.cardContent}>
                {/* Salasanan vaihto */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>{t('settings.password.title')}</h4>
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
                    <div className={`${styles.message} ${passwordMessage.includes('Virhe') ? styles.messageError : styles.messageSuccess}`} style={{ marginBottom: '12px' }}>
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

                <div className={styles.divider}></div>

                {/* Sähköpostin vaihto */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>{t('settings.email.title')}</h4>
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
                    <div className={`${styles.message} ${emailMessage.includes('Virhe') || emailMessage.includes('sama kuin') ? styles.messageError : emailMessage.includes('Vahvistuslinkki') ? '' : styles.messageSuccess}`} style={{ 
                      marginBottom: '12px',
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
              </div>
            </div>

            {/* Sessio-asetukset -kortti */}
            <div className={`${styles.card} ${styles.cardNoPadding}`}>
              <div className={styles.cardHeader}>
                <h3>Sessio-asetukset</h3>
              </div>
              <div className={styles.cardContent}>
                <TimeoutSettings />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 