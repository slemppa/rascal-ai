import React, { useState, useEffect } from 'react'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import styles from './DashboardPage.module.css'

function EditPostModal({ post, onClose, onSave }) {
  const [idea, setIdea] = useState(post.Idea || '')
  const [caption, setCaption] = useState(post.Caption || '')
  const [publishDate, setPublishDate] = useState(post["Publish Date"] ? post["Publish Date"].slice(0, 16) : '') // yyyy-MM-ddTHH:mm
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = React.useRef(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

  // Autoresize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [caption])

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const payload = {
        "Record ID": post["Record ID"] || post.id,
        Idea: idea,
        Caption: caption,
        "Publish Date": publishDate,
        updateType: 'postUpdate'
      }
      const res = await fetch('/api/update-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Tallennus epäonnistui')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSave(payload)
      }, 1200)
    } catch (err) {
      setError('Tallennus epäonnistui')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: isMobile ? 20 : 32,
        maxWidth: isMobile ? '100%' : 600,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>Muokkaa julkaisua</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#6b7280'
          }}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Idean kuvaus</label>
            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Kuvaile julkaisun idea..."
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Julkaisun teksti</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder="Kirjoita julkaisun teksti..."
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>Julkaisupäivä</label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14
              }}
            />
          </div>
          
          {error && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 14
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              padding: 12,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              color: '#16a34a',
              fontSize: 14
            }}>
              Tallennettu onnistuneesti!
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              Peruuta
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 8,
                background: '#2563eb',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: saving ? 0.7 : 1
              }}
            >
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [imagesUploaded, setImagesUploaded] = useState(false) // Status kuvien lähettämisestä
  const [audioUploaded, setAudioUploaded] = useState(false) // Status äänen lähettämisestä
  const [selectedImages, setSelectedImages] = useState([]) // Valitut kuvat
  const [selectedAudio, setSelectedAudio] = useState(null) // Valittu äänitiedosto
  const [dragActiveImages, setDragActiveImages] = useState(false)
  const [dragActiveAudio, setDragActiveAudio] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false) // Loading state
  const [avatarError, setAvatarError] = useState('') // Error state
  const imagesDropRef = React.useRef(null)
  const audioDropRef = React.useRef(null)
  const [totalCallPrice, setTotalCallPrice] = useState(0)

  // Responsiivinen apu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError(null)
      // Hakee kirjautuneen käyttäjän postaukset RLS:n turvin
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('publish_date', { ascending: false })
      if (error) setError('Virhe haettaessa julkaisuja')
      setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  useEffect(() => {
    const fetchCallPrice = async () => {
      // Hae kuluvan kuukauden puheluiden kokonaishinta
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const { data, error } = await supabase
        .from('call_logs')
        .select('price')
        .gte('call_date', firstDay.toISOString())
        .lte('call_date', lastDay.toISOString())
      if (!error && data) {
        const sum = data.reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)
        setTotalCallPrice(sum)
      } else {
        setTotalCallPrice(0)
      }
    }
    fetchCallPrice()
  }, [])

  // Tarkista Avatar-materiaalien status
  useEffect(() => {
    const checkAvatarStatus = async () => {
      try {
        const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
        const companyId = userRaw?.companyId || userRaw?.user?.companyId
        
        if (!companyId) {
          return
        }

        const response = await fetch('/api/avatar-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            companyId: companyId,
            action: 'checkStatus'
          })
        })

        if (response.ok) {
          const data = await response.json()

          /*
            Webhook palauttaa taulukon objekteja. Merkkaamme materiaalit ladatuiksi näin:
            • imagesUploaded  = löytyy vähintään yksi objekti, jossa on "Avatar IDs"-kenttä tai Media-taulukossa on vähintään yksi kuva.
            • audioUploaded   = löytyy vähintään yksi objekti, jossa on "Voice ID"-kenttä (truthy).
          */
          const hasImages = Array.isArray(data) && data.some(rec => {
            const avatarIds = rec["Avatar IDs"] || rec["Avatar IDs (from something)"]
            const mediaArr  = Array.isArray(rec.Media) ? rec.Media : []
            return (avatarIds && avatarIds.toString().trim() !== '') || mediaArr.length > 0
          })
          const hasAudio = Array.isArray(data) && data.some(rec => {
            const voiceId = rec["Voice ID"]
            return voiceId && voiceId.toString().trim() !== ''
          })

          setImagesUploaded(hasImages)
          setAudioUploaded(hasAudio)
        } else {
          console.error('Avatar status response not ok:', await response.text())
        }
      } catch (error) {
        console.error('Virhe tarkistettaessa Avatar-statusta:', error)
      }
    }
    
    checkAvatarStatus()
  }, [])

  const handleSavePost = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost["Record ID"] || post["Record ID"] === updatedPost["Record ID"]
          ? { ...post, ...updatedPost }
          : post
      )
    )
    setEditingPost(null)
  }

  // Image drag & drop handlers
  const handleImagesDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveImages(true)
  }
  const handleImagesDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveImages(false)
  }
  const handleImagesDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveImages(false)
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      const newImages = files.slice(0, 4 - selectedImages.length) // Max 4 kuvaa yhteensä
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 4))
    }
  }
  const handleImagesInput = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      const newImages = files.slice(0, 4 - selectedImages.length)
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 4))
    }
  }
  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Audio drag & drop handlers
  const handleAudioDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAudio(true)
  }
  const handleAudioDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAudio(false)
  }
  const handleAudioDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAudio(false)
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('audio/'))
    if (files.length > 0) {
      setSelectedAudio(files[0])
    }
  }
  const handleAudioInput = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'))
    if (files.length > 0) {
      setSelectedAudio(files[0])
    }
  }
  const handleRemoveAudio = () => {
    setSelectedAudio(null)
  }

  // Upload functions
  const handleUploadImages = async () => {
    if (selectedImages.length === 0) return
    setUploadingAvatar(true)
    setAvatarError('')

    try {
      // Hae companyId localStoragesta
      const userRaw = localStorage.getItem('user')
      const companyId = userRaw ? JSON.parse(userRaw)?.companyId || JSON.parse(userRaw)?.user?.companyId : null
      
      const uploads = await Promise.all(selectedImages.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        if (companyId) {
          formData.append('companyId', companyId)
        }
        
        const res = await fetch('/api/avatar-upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('upload failed')
        return res.json()
      }))

      setImagesUploaded(true)
    } catch (err) {
      console.error(err)
      setAvatarError('Virhe kuvien lähettämisessä')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUploadAudio = async () => {
    if (!selectedAudio) return
    setUploadingAvatar(true)
    setAvatarError('')

    try {
      // Hae companyId localStoragesta
      const userRaw = localStorage.getItem('user')
      const companyId = userRaw ? JSON.parse(userRaw)?.companyId || JSON.parse(userRaw)?.user?.companyId : null
      
      const formData = new FormData()
      formData.append('file', selectedAudio)
      if (companyId) {
        formData.append('companyId', companyId)
      }
      
      const res = await fetch('/api/avatar-upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json()
      setAudioUploaded(true)
    } catch (err) {
      console.error(err)
      setAvatarError('Virhe äänen lähettämisessä')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Kirjaudu ulos -handler
  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  // Laske tulevat postaukset (seuraavat 7 päivää)
  const now = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(now.getDate() + 7)
  const upcomingCount = posts.filter(post => {
    const date = post.publish_date ? new Date(post.publish_date) : null
    return date && date > now && date < weekFromNow
  }).length

  // Laske julkaisut kuluvassa kuukaudessa (created_at mukaan)
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const monthlyCount = posts.filter(post => {
    const date = post.created_at ? new Date(post.created_at) : null
    return date && date.getMonth() === thisMonth && date.getFullYear() === thisYear
  }).length

  const stats = [
    { label: 'Tulevat postaukset', value: upcomingCount, sub: 'Seuraavat 7 päivää', color: '#22c55e' },
    { label: 'Julkaisut kuukaudessa', value: monthlyCount, sub: 'Tämä kuukausi', color: '#2563eb' },
    { label: 'Puheluiden kokonaishinta', value: totalCallPrice.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }), sub: 'Tämä kuukausi', color: '#f59e42' },
    { label: 'Tavoitteet', value: '--', sub: 'Tulossa pian', color: '#fbbf24' },
    { label: 'AI käyttö', value: '--', sub: 'Tulossa pian', color: '#7c3aed' },
  ]

  return (
    <>
      <div className={styles['dashboard-container']}>
        <div className={styles['dashboard-header']}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#1f2937', margin: 0 }}>Kojelauta</h2>
        </div>
        <div className={styles['dashboard-bentogrid']}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.card}>
              <div className={styles['stat-label']}>{stat.label}</div>
              <div className={styles['stat-number']} style={{ color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
          {/* Dummy chart-kortti */}
          <div className={styles.card} style={{ gridColumn: 'span 2', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>Engagement Analytics</div>
            <div style={{ width: '100%', height: 120, background: 'linear-gradient(90deg,#22c55e22,#2563eb22)', borderRadius: 12, display: 'flex', alignItems: 'flex-end', gap: 8, padding: 16 }}>
              {[40, 60, 80, 50, 90, 70, 100, 60, 80, 50, 70, 90].map((v, i) => (
                <div key={i} style={{ flex: 1, height: v, background: '#22c55e', borderRadius: 6, minWidth: 8 }}></div>
              ))}
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>Dummy chart – korvaa oikealla myöhemmin</div>
          </div>
          {/* Dummy taulukko-kortti */}
          <div className={styles.card} style={{ gridColumn: 'span 2', minHeight: 220, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>Aikataulu</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
              <thead>
                <tr style={{ color: '#6b7280', fontWeight: 600, background: '#f7f8fc' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>#</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Tyyppi</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Pvm</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td><td>Postaus</td><td>Valmis</td><td>2024-07-25</td>
                </tr>
                <tr>
                  <td>2</td><td>Puhelu</td><td>Odottaa</td><td>2024-07-26</td>
                </tr>
                <tr>
                  <td>3</td><td>AI</td><td>Valmis</td><td>2024-07-27</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
} 