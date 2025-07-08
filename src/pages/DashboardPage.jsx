import React, { useState } from 'react'
import PageHeader from '../components/PageHeader'

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
  const [existingImagesCount, setExistingImagesCount] = useState(0) // Jo lähetettyjä kuvia
  const [selectedImages, setSelectedImages] = useState([]) // Valitut kuvat
  const [selectedAudio, setSelectedAudio] = useState(null) // Valittu äänitiedosto
  const [dragActiveImages, setDragActiveImages] = useState(false)
  const [dragActiveAudio, setDragActiveAudio] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false) // Loading state
  const [avatarError, setAvatarError] = useState('') // Error state
  const [monthlyLimitData, setMonthlyLimitData] = useState([]) // Kuukausirajoituksen data
  const imagesDropRef = React.useRef(null)
  const audioDropRef = React.useRef(null)

  // Responsiivinen apu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  React.useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId
        const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`
        const response = await fetch(url)
        const data = await response.json()
        // Oikea datan purku - sama logiikka kuin ManagePostsPage:ssä
        const all = Array.isArray(data?.[0]?.data) ? data[0].data : [];
        setPosts(all.filter(p => !p["Slide No."]));
      } catch (err) {
        setError('Virhe haettaessa julkaisuja')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  // Tarkista Avatar-materiaalien status
  React.useEffect(() => {
    const checkAvatarStatus = async () => {
      try {
        const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
        const companyId = userRaw?.companyId || userRaw?.user?.companyId
        
        console.log('Avatar status check - userRaw:', userRaw)
        console.log('Avatar status check - companyId:', companyId)
        
        if (!companyId) {
          console.log('Avatar status check skipped - no companyId')
          return
        }

        console.log('Sending avatar status request...')
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

        console.log('Avatar status response:', response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Avatar status data:', data)

          /*
            Webhook palauttaa taulukon objekteja. Merkkaamme materiaalit ladatuiksi näin:
            • imagesUploaded  = löytyy vähintään yksi objekti, jossa on "Avatar IDs"-kenttä tai Media-taulukossa on vähintään yksi kuva.
            • audioUploaded   = löytyy vähintään yksi objekti, jossa on "Voice ID"-kenttä (truthy).
            • existingImagesCount = lasketaan kuvien määrä Media-taulukoista.
          */
          let totalImageCount = 0
          let hasImages = false
          let hasAudio = false

          if (Array.isArray(data)) {
            data.forEach(rec => {
              // Kuvien laskenta
              const avatarIds = rec["Avatar IDs"] || rec["Avatar IDs (from something)"]
              const mediaArr = Array.isArray(rec.Media) ? rec.Media : []
              
              if ((avatarIds && avatarIds.toString().trim() !== '') || mediaArr.length > 0) {
                hasImages = true
                totalImageCount += mediaArr.length
              }

              // Äänen tarkistus
              const voiceId = rec["Voice ID"]
              if (voiceId && voiceId.toString().trim() !== '') {
                hasAudio = true
              }
            })
          }

          setImagesUploaded(hasImages)
          setAudioUploaded(hasAudio)
          setExistingImagesCount(totalImageCount)
        } else {
          console.error('Avatar status response not ok:', await response.text())
        }
      } catch (error) {
        console.error('Virhe tarkistettaessa Avatar-statusta:', error)
      }
    }
    
    checkAvatarStatus()
  }, [])

  // Kuukausirajoituksen laskenta - käytetään samaa dataa kuin posts-tilassa
  React.useEffect(() => {
    const fetchMonthlyLimitData = async () => {
      try {
        const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId
        const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`
        const response = await fetch(url)
        const data = await response.json()
        const all = Array.isArray(data?.[0]?.data) ? data[0].data : [];
        // Suodata pois slide-tiedostot samalla tavalla kuin posts-tilassa
        setMonthlyLimitData(all.filter(p => !p["Slide No."]))
      } catch (error) {
        console.error('Virhe kuukausirajoituksen datan haussa:', error)
      }
    }
    fetchMonthlyLimitData()
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
      const maxNewImages = 4 - existingImagesCount - selectedImages.length
      const newImages = files.slice(0, Math.max(0, maxNewImages))
      setSelectedImages(prev => [...prev, ...newImages])
    }
  }
  const handleImagesInput = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      const maxNewImages = 4 - existingImagesCount - selectedImages.length
      const newImages = files.slice(0, Math.max(0, maxNewImages))
      setSelectedImages(prev => [...prev, ...newImages])
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
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('audio/') || file.type.startsWith('video/'))
    if (files.length > 0) {
      setSelectedAudio(files[0])
    }
  }
  const handleAudioInput = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/') || file.type.startsWith('video/'))
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
      
      console.log('Image upload debug:')
      console.log('- UserRaw:', userRaw)
      console.log('- CompanyId:', companyId)
      
      const uploads = await Promise.all(selectedImages.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        if (companyId) {
          formData.append('companyId', companyId)
          console.log('- Added companyId to FormData:', companyId)
        } else {
          console.log('- No companyId to add')
        }
        
        const res = await fetch('/api/avatar-upload', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('upload failed')
        return res.json()
      }))

      console.log('Kuvat ladattu', uploads)
      setImagesUploaded(true)
      setExistingImagesCount(prev => prev + selectedImages.length)
      setSelectedImages([]) // Tyhjennä valitut kuvat
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
      
      console.log('Video/Audio upload debug:')
      console.log('- UserRaw:', userRaw)
      console.log('- CompanyId:', companyId)
      
      const formData = new FormData()
      formData.append('file', selectedAudio)
      if (companyId) {
        formData.append('companyId', companyId)
        console.log('- Added companyId to FormData:', companyId)
      } else {
        console.log('- No companyId to add')
      }
      
      const res = await fetch('/api/avatar-upload', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json()
      console.log('Video/Audio ladattu', data)
      setAudioUploaded(true)
    } catch (err) {
      console.error(err)
      setAvatarError('Virhe video/äänen lähettämisessä')
    } finally {
      setUploadingAvatar(false)
    }
  }

  if (loading) return <div style={{ padding: 32, textAlign: 'center' }}>Ladataan...</div>
  if (error) return <div style={{ padding: 32, color: 'red' }}>{error}</div>

  // Tulevat postaukset (Publish Date tulevaisuudessa)
  const now = new Date()
  const upcomingPosts = posts.filter(post => {
    const date = post["Publish Date"] ? new Date(post["Publish Date"]) : null
    return date && date > now
  }).sort((a, b) => new Date(a["Publish Date"]) - new Date(b["Publish Date"]))

  // Kuukausirajoituksen laskenta
  const postsThisMonth = monthlyLimitData.filter(post => {
    if (!post["createdTime"]) return false
    
    const createdDate = new Date(post["createdTime"])
    const currentDate = new Date()
    
    // Vertaa kuukausia ja vuosia paikallisen ajan mukaan
    return createdDate.getMonth() === currentDate.getMonth() && 
           createdDate.getFullYear() === currentDate.getFullYear()
  }).length
  
  const monthlyLimit = 30
  const isMonthlyLimitReached = postsThisMonth >= monthlyLimit

  return (
    <>
      <PageHeader title="Kojelauta" />
      <div style={{ padding: '32px' }}>
        {/* Bentogrid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
          gridTemplateRows: isMobile ? 'auto' : 'auto auto auto',
          gap: 24,
          maxWidth: '1400px'
        }}
        className="dashboard-bentogrid"
        >
          {/* Tulevat postaukset - yhteenveto */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            padding: 24, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            ...(isMobile ? {} : {gridColumn: '1', gridRow: '1'})
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Tulevat postaukset</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>{upcomingPosts.length}</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Seuraavat 7 päivää</div>
          </div>

          {/* Kuukausirajoitus-kortti */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            padding: 24,
            position: 'relative',
            ...(isMobile ? {} : {gridColumn: '2', gridRow: '1'})
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Julkaisut kuukaudessa</div>
            <div style={{ 
              fontSize: 32, 
              fontWeight: 800, 
              color: isMonthlyLimitReached ? '#dc2626' : '#2563eb', 
              lineHeight: 1 
            }}>
              {postsThisMonth}/{monthlyLimit}
            </div>
            <div style={{ 
              color: isMonthlyLimitReached ? '#dc2626' : '#6b7280', 
              fontSize: 14, 
              marginTop: 4,
              fontWeight: isMonthlyLimitReached ? 600 : 400
            }}>
              {isMonthlyLimitReached ? 'Raja saavutettu' : `${monthlyLimit - postsThisMonth} jäljellä`}
            </div>
            {isMonthlyLimitReached && (
              <div style={{ 
                position: 'absolute', 
                top: 8, 
                right: 8, 
                fontSize: 12, 
                color: '#dc2626',
                background: '#fef2f2',
                padding: '2px 6px',
                borderRadius: 4,
                fontWeight: 600
              }}>
                ⚠️ Raja
              </div>
            )}
          </div>

          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            padding: 24,
            position: 'relative',
            ...(isMobile ? {} : {gridColumn: '3', gridRow: '1'})
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Käytetty aika</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#9ca3af', lineHeight: 1 }}>--</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Tulossa pian</div>
            <div style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              fontSize: 12, 
              color: '#9ca3af',
              background: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              🚧 Dev
            </div>
          </div>

          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            padding: 24,
            position: 'relative',
            ...(isMobile ? {} : {gridColumn: '4', gridRow: '1'})
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>Tavoitteet</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#9ca3af', lineHeight: 1 }}>--</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Tulossa pian</div>
            <div style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              fontSize: 12, 
              color: '#9ca3af',
              background: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              🚧 Dev
            </div>
          </div>

          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            padding: 24,
            position: 'relative',
            ...(isMobile ? {} : {gridColumn: '5', gridRow: '1'})
          }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#374151', marginBottom: 8 }}>AI käyttö</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#9ca3af', lineHeight: 1 }}>--</div>
            <div style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Tulossa pian</div>
            <div style={{ 
              position: 'absolute', 
              top: 8, 
              right: 8, 
              fontSize: 12, 
              color: '#9ca3af',
              background: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: 4
            }}>
              🚧 Dev
            </div>
          </div>

          {/* Tulevat postaukset lista */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            padding: 32,
            ...(isMobile ? {} : {gridColumn: '1 / 4', gridRow: '2'})
          }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1f2937', marginBottom: 20 }}>Tulevat postaukset</div>
          {upcomingPosts.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: 32 }}>Ei tulevia postauksia</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {upcomingPosts.map((post, idx) => {
                const date = post["Publish Date"] ? new Date(post["Publish Date"]) : null
                const day = date ? date.toLocaleDateString('fi-FI', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'
                const time = date ? date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : ''
                return (
                  <div key={post.id || idx} style={{
                    background: '#f3f6fd',
                    borderRadius: 12,
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    borderLeft: '5px solid #2563eb',
                    boxShadow: '0 1px 3px rgba(37,99,235,0.04)'
                  }}>
                    {/* Ikoni */}
                    <div style={{ fontSize: 22, color: '#2563eb', marginRight: 8 }}>
                      {post.Type === 'Sähköposti' ? '✉️' : '📄'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, color: '#1f2937', marginBottom: 2 }}>{post.Idea || post.title || 'Ei otsikkoa'}</div>
                      <div style={{ color: '#6b7280', fontSize: 14 }}>{post.Type || ''}{post.Type && post.Channel ? ' • ' : ''}{post.Channel || ''}</div>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 15, minWidth: 80, textAlign: 'right' }}>
                      {day} <span style={{ color: '#2563eb', fontWeight: 700 }}>{time}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          </div>

          {/* Avatar-videoiden hallinta */}
          <div style={{ 
            background: '#fff', 
            borderRadius: 16, 
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 
            padding: 32,
            ...(isMobile ? {} : {gridColumn: '4 / 6', gridRow: '2'})
          }}>
            <div style={{ fontWeight: 700, fontSize: 20, color: '#1f2937', marginBottom: 20 }}>Avatar-videot</div>
            
            {/* Jos molemmat valmiit, näytä vain valmis-viesti */}
            {imagesUploaded && audioUploaded ? (
              <div style={{
                background: '#f0fdf4',
                borderRadius: 12,
                padding: 24,
                border: '2px solid #16a34a',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#16a34a', marginBottom: 8 }}>
                  ✅ Avatarit ovat valmiit tuotantoon
                </div>
                <div style={{ fontSize: 14, color: '#15803d' }}>
                  Kuvat ja ääni on lähetetty onnistuneesti
                </div>
              </div>
            ) : (
              <>
                {/* Kuvien drag & drop */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#374151', marginBottom: 12 }}>
                    Kuvat (max 4kpl) {existingImagesCount > 0 && `- ${existingImagesCount} jo lähetetty`} {selectedImages.length > 0 && `- ${selectedImages.length} uutta valittu`}
                    {!imagesUploaded && (existingImagesCount + selectedImages.length < 4) && (
                      <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 400, marginTop: 4 }}>
                        Voit lähettää vielä {4 - existingImagesCount - selectedImages.length} kuvaa
                      </div>
                    )}
                  </div>
                  
                  {/* Drag & drop alue */}
                  {!imagesUploaded && (existingImagesCount + selectedImages.length < 4) && (
                    <div
                      ref={imagesDropRef}
                      onDragOver={handleImagesDragOver}
                      onDragLeave={handleImagesDragLeave}
                      onDrop={handleImagesDrop}
                      style={{
                        border: dragActiveImages ? '2px solid #2563eb' : '2px dashed #d1d5db',
                        borderRadius: 12,
                        background: dragActiveImages ? '#f0f6ff' : '#f9fafb',
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'border 0.2s, background 0.2s',
                        marginBottom: 12
                      }}
                      onClick={() => imagesDropRef.current?.querySelector('input[type=file]').click()}
                    >
                      📸 Vedä ja pudota kuvia tähän tai <span style={{color: '#2563eb', textDecoration: 'underline'}}>valitse tiedostot</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleImagesInput}
                      />
                    </div>
                  )}

                  {/* Maksimi saavutettu viesti */}
                  {!imagesUploaded && (existingImagesCount + selectedImages.length >= 4) && (
                    <div style={{
                      padding: 16,
                      background: '#f3f4f6',
                      border: '2px solid #9ca3af',
                      borderRadius: 12,
                      textAlign: 'center',
                      marginBottom: 12
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
                        📸 Maksimi kuvamäärä saavutettu (4/4)
                      </div>
                      <div style={{ fontSize: 14, color: '#6b7280' }}>
                        {existingImagesCount > 0 && `${existingImagesCount} aiemmin lähetettyä`}
                        {existingImagesCount > 0 && selectedImages.length > 0 && " + "}
                        {selectedImages.length > 0 && `${selectedImages.length} uutta valittua`}
                      </div>
                    </div>
                  )}

                  {imagesUploaded && (
                    <div style={{
                      padding: 16,
                      background: '#f0fdf4',
                      border: '2px solid #16a34a',
                      borderRadius: 12,
                      textAlign: 'center',
                      marginBottom: 12
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>
                        ✅ Kuvat lähetetty onnistuneesti
                      </div>
                      <div style={{ fontSize: 14, color: '#15803d' }}>
                        {selectedImages.length > 0 ? `${selectedImages.length} kuvaa` : 'Materiaalit'} on käsitelty
                      </div>
                    </div>
                  )}

                  {/* Valitut kuvat */}
                  {selectedImages.length > 0 && !imagesUploaded && (
                    <div style={{
                      background: '#f3f4f6',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12,
                      maxHeight: 120,
                      overflowY: 'auto'
                    }}>
                      {selectedImages.map((file, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          marginBottom: 4,
                          background: '#fff',
                          borderRadius: 6,
                          fontSize: 13
                        }}>
                          <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 200
                          }}>
                            📷 {file.name}
                          </span>
                          <span
                            style={{
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 16,
                              marginLeft: 8
                            }}
                            onClick={() => handleRemoveImage(index)}
                          >
                            ❌
                          </span>
                        </div>
                      ))}
                    </div>
                  )}


                </div>

                {/* Video/Äänen drag & drop */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: '#374151', marginBottom: 12 }}>
                    Video tai Ääni (max 5min) {selectedAudio && `- ${selectedAudio.name}`}
                  </div>
                  
                  {/* Drag & drop alue */}
                  {!audioUploaded && (
                    <div
                      ref={audioDropRef}
                      onDragOver={handleAudioDragOver}
                      onDragLeave={handleAudioDragLeave}
                      onDrop={handleAudioDrop}
                      style={{
                        border: dragActiveAudio ? '2px solid #2563eb' : '2px dashed #d1d5db',
                        borderRadius: 12,
                        background: dragActiveAudio ? '#f0f6ff' : '#f9fafb',
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: '#6b7280',
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'border 0.2s, background 0.2s',
                        marginBottom: 12
                      }}
                      onClick={() => audioDropRef.current?.querySelector('input[type=file]').click()}
                    >
                      🎬🎵 Vedä ja pudota video- tai äänitiedosto tähän tai <span style={{color: '#2563eb', textDecoration: 'underline'}}>valitse tiedosto</span>
                      <input
                        type="file"
                        accept="audio/*,video/*"
                        style={{ display: 'none' }}
                        onChange={handleAudioInput}
                      />
                    </div>
                  )}

                  {audioUploaded && (
                    <div style={{
                      padding: 16,
                      background: '#f0fdf4',
                      border: '2px solid #16a34a',
                      borderRadius: 12,
                      textAlign: 'center',
                      marginBottom: 12
                    }}>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#16a34a', marginBottom: 4 }}>
                        ✅ Video/Ääni lähetetty onnistuneesti
                      </div>
                      <div style={{ fontSize: 14, color: '#15803d' }}>
                        {selectedAudio ? selectedAudio.name : 'Mediatiedosto'} on käsitelty
                      </div>
                    </div>
                  )}

                  {/* Valittu ääni */}
                  {selectedAudio && !audioUploaded && (
                    <div style={{
                      background: '#f3f4f6',
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 12
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 8px',
                        background: '#fff',
                        borderRadius: 6,
                        fontSize: 13
                      }}>
                        <span style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 200
                        }}>
                          {selectedAudio.type.startsWith('video/') ? '🎬' : '🎵'} {selectedAudio.name}
                        </span>
                        <span
                          style={{
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: 16,
                            marginLeft: 8
                          }}
                          onClick={handleRemoveAudio}
                        >
                          ❌
                        </span>
                      </div>
                    </div>
                  )}


                </div>

                {/* Lähetä Avatar materiaalit nappi */}
                {!imagesUploaded && !audioUploaded && (
                  <div style={{ marginBottom: 24 }}>
                    <button
                      onClick={async () => {
                        if (selectedImages.length > 0) {
                          await handleUploadImages()
                        }
                        if (selectedAudio) {
                          await handleUploadAudio()
                        }
                      }}
                      disabled={(selectedImages.length === 0 && !selectedAudio) || uploadingAvatar}
                      style={{
                        padding: '12px 24px',
                        background: ((selectedImages.length > 0 || selectedAudio) && !uploadingAvatar) ? '#7c3aed' : '#d1d5db',
                        color: ((selectedImages.length > 0 || selectedAudio) && !uploadingAvatar) ? '#fff' : '#9ca3af',
                        border: 'none',
                        borderRadius: 8,
                        cursor: ((selectedImages.length > 0 || selectedAudio) && !uploadingAvatar) ? 'pointer' : 'not-allowed',
                        fontSize: 16,
                        fontWeight: 600,
                        width: '100%',
                        opacity: uploadingAvatar ? 0.7 : 1
                      }}
                    >
                      {uploadingAvatar ? '⏳ Lähetetään...' : 
                        selectedImages.length > 0 && selectedAudio ? '🚀 Lähetä kuvat ja video/ääni' :
                        selectedImages.length > 0 ? '🚀 Lähetä kuvat' :
                        selectedAudio ? '🚀 Lähetä video/ääni' : '🚀 Lähetä Avatar materiaalit'
                      }
                    </button>
                  </div>
                )}

                {/* Virheviesti */}
                {avatarError && (
                  <div style={{
                    padding: 12,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#dc2626',
                    fontSize: 14,
                    marginBottom: 16,
                    textAlign: 'center'
                  }}>
                    {avatarError}
                  </div>
                )}

                {/* Progress indicator */}
                {(imagesUploaded || audioUploaded || selectedImages.length > 0 || selectedAudio) && (
                  <div style={{
                    background: '#f3f4f6',
                    borderRadius: 8,
                    padding: 16,
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#374151', marginBottom: 8 }}>
                      Avatar-materiaalien tila
                    </div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>
                      {(existingImagesCount > 0 || selectedImages.length > 0) && (
                        <>
                          {imagesUploaded || existingImagesCount > 0 ? 
                            `✓ Kuvat: ${existingImagesCount + (imagesUploaded && selectedImages.length > 0 ? selectedImages.length : 0)}/4` : 
                            `○ Kuvat odottaa: ${selectedImages.length}/4`
                          }
                        </>
                      )}
                      {(existingImagesCount > 0 || selectedImages.length > 0) && selectedAudio && <br/>}
                      {selectedAudio && (audioUploaded ? '✓ Video/Ääni lähetetty' : '○ Video/Ääni odottaa')}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 