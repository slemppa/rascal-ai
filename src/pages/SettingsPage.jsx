import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PageHeader from '../components/PageHeader'
import CarouselTemplateSelector from '../components/CarouselTemplateSelector'
import SocialMediaConnect from '../components/SocialMediaConnect'
import TimeoutSettings from '../components/TimeoutSettings'

import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { user } = useAuth()
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
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

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
          setMessage('Käyttäjätietoja ei löytynyt. Ota yhteyttä tukeen.')
        } else {
          setUserProfile(data)
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
        setMessage('Virhe käyttäjätietojen haussa. Ota yhteyttä tukeen.')
      } finally {
        setProfileLoading(false)
      }
    }

    fetchUserProfile()
  }, [user?.id])

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
        setMessage(`Virhe: ${error.message}`)
      } else {
        setMessage('Tiedot päivitetty onnistuneesti!')
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
      setMessage(`Virhe: ${error.message}`)
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
      setPasswordMessage('Uudet salasanat eivät täsmää')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('Uusi salasana on liian lyhyt (vähintään 6 merkkiä)')
      return
    }
    
    if (!passwordData.currentPassword) {
      setPasswordMessage('Nykyinen salasana vaaditaan')
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
        setPasswordMessage('Nykyinen salasana on väärä')
        return
      }
      
      // Jos nykyinen salasana on oikein, vaihda salasana
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })
      
      if (error) {
        setPasswordMessage(`Virhe: ${error.message}`)
      } else {
        setPasswordMessage('Salasana vaihdettu onnistuneesti!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordChange(false)
      }
    } catch (error) {
      setPasswordMessage(`Virhe: ${error.message}`)
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

  return (
    <>
      <div className={styles['settings-container']}>
        <div className={styles['settings-header']}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', margin: 0 }}>Asetukset</h2>
        </div>
        <div className={styles['settings-bentogrid']}>
          {/* Vasen sarake: Käyttäjätiedot */}
          <div className={styles.card}>
            {profileLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: '16px', color: '#6b7280' }}>Ladataan käyttäjätietoja...</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Käyttäjätiedot</h2>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      style={{
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Muokkaa
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        {loading ? 'Tallennetaan...' : 'Tallenna'}
                      </button>
                      <button 
                        onClick={handleCancel}
                        style={{
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Peruuta
                      </button>
                    </div>
                  )}
                </div>
            
                {message && (
                  <div style={{ 
                    padding: '8px 12px', 
                    borderRadius: '6px', 
                    marginBottom: '12px',
                    fontSize: '14px',
                    background: message.includes('Virhe') ? '#fef2f2' : '#f0fdf4',
                    color: message.includes('Virhe') ? '#dc2626' : '#16a34a',
                    border: `1px solid ${message.includes('Virhe') ? '#fecaca' : '#bbf7d0'}`
                  }}>
                    {message}
                  </div>
                )}

                <div className={styles['form-group']}>
                  <label>Nimi</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="contact_person"
                      value={formData.contact_person} 
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      placeholder="Syötä nimesi"
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={name || 'Ei asetettu'} 
                      readOnly 
                      className={`${styles['form-input']} ${styles.readonly}`} 
                    />
                  )}
                </div>
                
                <div className={styles['form-group']}>
                  <label>Sähköposti</label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      name="contact_email"
                      value={formData.contact_email} 
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      placeholder="Syötä sähköpostiosoitteesi"
                    />
                  ) : (
                    <input 
                      type="email" 
                      value={email || 'Ei saatavilla'} 
                      readOnly 
                      className={`${styles['form-input']} ${styles.readonly}`} 
                    />
                  )}
                </div>
                
                <div className={styles['form-group']}>
                  <label>Yritys</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      name="company_name"
                      value={formData.company_name} 
                      onChange={handleInputChange}
                      className={styles['form-input']}
                      placeholder="Syötä yrityksesi nimi"
                    />
                  ) : (
                    <input 
                      type="text" 
                      value={companyName || 'Ei asetettu'} 
                      readOnly 
                      className={`${styles['form-input']} ${styles.readonly}`} 
                    />
                  )}
                </div>
                
                <div className={styles['form-group']}>
                  <label>Toimiala</label>
                  <input 
                    type="text" 
                    value={industry || 'Ei asetettu'} 
                    readOnly 
                    className={`${styles['form-input']} ${styles.readonly}`} 
                  />
                </div>
                
                <div className={styles['form-group']}>
                  <label>Käyttäjätunnus</label>
                  <input 
                    type="text" 
                    value={userProfile?.id || user?.id || 'Ei saatavilla'} 
                    readOnly 
                    className={`${styles['form-input']} ${styles.readonly}`} 
                    style={{fontFamily: 'monospace', fontSize: '12px'}} 
                  />
                </div>
                
                {/* Salasanan vaihto */}
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: 0 }}>Salasanan vaihto</h3>
                    {!showPasswordChange ? (
                      <button 
                        onClick={() => setShowPasswordChange(true)}
                        style={{
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Vaihda salasana
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          onClick={handlePasswordSave}
                          disabled={passwordLoading}
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: passwordLoading ? 'not-allowed' : 'pointer',
                            opacity: passwordLoading ? 0.6 : 1
                          }}
                        >
                          {passwordLoading ? 'Tallennetaan...' : 'Tallenna'}
                        </button>
                        <button 
                          onClick={handlePasswordCancel}
                          style={{
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Peruuta
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
                        <label>Nykyinen salasana</label>
                        <input 
                          type="password" 
                          name="currentPassword"
                          value={passwordData.currentPassword} 
                          onChange={handlePasswordChange}
                          className={styles['form-input']}
                          placeholder="Syötä nykyinen salasanasi"
                        />
                      </div>
                      
                      <div className={styles['form-group']}>
                        <label>Uusi salasana</label>
                        <input 
                          type="password" 
                          name="newPassword"
                          value={passwordData.newPassword} 
                          onChange={handlePasswordChange}
                          className={styles['form-input']}
                          placeholder="Syötä uusi salasana"
                        />
                      </div>
                      
                      <div className={styles['form-group']}>
                        <label>Vahvista uusi salasana</label>
                        <input 
                          type="password" 
                          name="confirmPassword"
                          value={passwordData.confirmPassword} 
                          onChange={handlePasswordChange}
                          className={styles['form-input']}
                          placeholder="Syötä uusi salasana uudelleen"
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
              <SocialMediaConnect />
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
          </div>
        </div>
      </div>
    </>
  )
} 

// Moderni monikuvakomponentti Tailwindilla, hakee kuvat backendistä companyId:lla
function AvatarSectionMulti({ companyId }) {
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
        setError('Kuvien haku epäonnistui');
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  // Lisää uusi kuva (lähetä backendiin)
  const handleAddImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (images.length >= 4) return;
    
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
          .catch(() => setError('Kuvien päivitys epäonnistui'));
        }, 2000);
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Kuvan lähetys epäonnistui');
      }
    } catch (e) {
      setError('Kuvan lähetys epäonnistui');
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  // Poista kuva backendistä (avatar-delete)
  const handleDeleteAvatar = async (avatarId) => {
    setLoading(true)
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
        setError(data.error || 'Poisto epäonnistui')
      }
    } catch (e) {
      setError('Poisto epäonnistui')
    } finally {
      setLoading(false)
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
      <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Avatar-kuvat</h2>
      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>Ladataan kuvia...</div>
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
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    borderRadius: '50%',
                    padding: '2px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    zIndex: 20,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
                  onClick={() => handleDeleteAvatar(img.variableId)}
                  aria-label="Poista kuva"
                >
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
                aria-label="Lisää uusi kuva"
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
                  Lisää
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
        {images.length}/4 kuvaa lisätty. Voit lisätä max 4 kuvaa.
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
} 

// Äänitiedostojen upload-komponentti
function VoiceSection({ companyId }) {
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
        setError('Äänitiedostojen haku epäonnistui');
      }
    } catch (error) {
      setError('Äänitiedostojen haku epäonnistui');
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
        setError(errorData.error || 'Äänitiedoston lähetys epäonnistui');
      }
    } catch (e) {
      setError('Äänitiedoston lähetys epäonnistui');
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
      <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#1f2937' }}>Äänitiedostot (Voice Clone)</h2>
      {loading ? (
        <div style={{ color: '#6b7280', fontSize: 14 }}>Ladataan äänitiedostoa...</div>
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
                    {audio.status === 'uploading' ? 'Käsitellään...' : 'Ääni lisätty'}
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
                aria-label="Lisää uusi äänitiedosto"
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
                  Lisää
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
        {audioFiles.length}/1 äänitiedosto lisätty. {audioFiles.length === 0 ? 'Lisää äänitiedosto voice clone -ominaisuutta varten.' : 'Äänitiedosto pysyy pysyvästi ja sitä ei voi poistaa.'}
      </div>
      {error && <div style={{ color: '#ef4444', fontSize: 11, marginTop: 6 }}>{error}</div>}
    </div>
  );
} 