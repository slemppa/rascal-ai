import React, { useEffect, useState } from 'react'
import axios from 'axios'
// import jwt_decode from 'jwt-decode' // poistettu
import { useNavigate } from 'react-router-dom'

function lyhenteleTeksti(teksti, max = 100) {
  if (!teksti) return ''
  return teksti.length > max ? teksti.slice(0, max) + '…' : teksti
}

function EditPostModal({ post, onClose, onSave }) {
  const [idea, setIdea] = useState(post.Idea || '')
  const [caption, setCaption] = useState(post.Caption || '')
  const [publishDate, setPublishDate] = useState(post["Publish Date"] ? post["Publish Date"].slice(0, 16) : '')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = React.useRef(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

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
      background: 'rgba(0,0,0,0.25)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflowY: 'auto',
      maxHeight: '100vh',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
        border: '1px solid #e1e8ed',
        padding: isMobile ? 16 : 40,
        maxWidth: 700,
        width: '95vw',
        minWidth: 0,
        position: 'relative',
        minHeight: 420,
        fontSize: isMobile ? 15 : 17,
        overflowY: 'auto',
        boxSizing: 'border-box',
        maxHeight: '95vh',
      }}>
        <button onClick={onClose} style={{position: 'absolute', top: isMobile ? 10 : 20, right: isMobile ? 10 : 20, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 8, padding: isMobile ? '6px 14px' : '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: isMobile ? 14 : 16}}>Sulje</button>
        {Array.isArray(post.Media) && post.Media.length > 0 ? (
          post.Media[0].type && post.Media[0].type.startsWith('video/') ? (
            <video controls style={{width: '100%', maxHeight: isMobile ? 140 : 260, background: '#f7fafc', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <source src={post.Media[0].url} type={post.Media[0].type} />
              Selaimesi ei tue videon toistoa.
            </video>
          ) : post.Media[0].type && post.Media[0].type.startsWith('image/') && post.Media[0].thumbnails && post.Media[0].thumbnails.large ? (
            <div style={{width: '100%', height: isMobile ? 140 : 260, background: '#f7fafc', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <img src={post.Media[0].thumbnails.large.url} alt="media" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 12}} />
            </div>
          ) : (
            <img src="/placeholder.png" alt="placeholder" style={{width: '100%', height: isMobile ? 140 : 260, objectFit: 'cover', borderRadius: 12, marginBottom: 24, background: '#f7fafc'}} />
          )
        ) : null}
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20}}>
          <label style={{fontWeight: 600, fontSize: isMobile ? 15 : 17}}>
            Idea:
            <input type="text" value={idea} onChange={e => setIdea(e.target.value)} style={{width: '100%', borderRadius: 10, border: '1.5px solid #e1e8ed', padding: isMobile ? '10px 12px' : '14px 16px', marginTop: 6, fontSize: isMobile ? 15 : 17, background: '#f7fafc', transition: 'border 0.2s'}} />
          </label>
          <label style={{fontWeight: 600, fontSize: isMobile ? 15 : 17}}>
            Julkaisu:
            <textarea ref={textareaRef} value={caption} onChange={e => setCaption(e.target.value)} style={{width: '100%', borderRadius: 10, border: '1.5px solid #e1e8ed', padding: isMobile ? '10px 12px' : '14px 16px', marginTop: 6, minHeight: isMobile ? 60 : 90, fontSize: isMobile ? 14 : 16, background: '#f7fafc', transition: 'border 0.2s', resize: 'none', overflow: 'hidden'}} />
          </label>
          <label style={{fontWeight: 600, fontSize: isMobile ? 15 : 17}}>
            Julkaisupäivä:
            <input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} style={{width: '100%', borderRadius: 10, border: '1.5px solid #e1e8ed', padding: isMobile ? '10px 12px' : '14px 16px', marginTop: 6, fontSize: isMobile ? 15 : 16, background: '#f7fafc', transition: 'border 0.2s'}} />
          </label>
          <div style={{display: 'flex', gap: isMobile ? 8 : 16, marginTop: 8, flexWrap: 'wrap'}}>
            <div style={{fontSize: isMobile ? 13 : 15, color: '#888'}}><b>Status:</b> {post.Status || '-'}</div>
            <div style={{fontSize: isMobile ? 13 : 15, color: '#888'}}><b>Tyyppi:</b> {post.Type || '-'}</div>
          </div>
          <button type="submit" disabled={saving} style={{background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: isMobile ? '10px 0' : '14px 0', fontWeight: 700, fontSize: isMobile ? 15 : 18, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8}}>
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
          {success && <div style={{color: '#2e7d32', fontWeight: 600, fontSize: isMobile ? 14 : 16, marginTop: 8, textAlign: 'center'}}>Tallennus onnistui!</div>}
          {error && <div style={{color: '#e53e3e', fontWeight: 600, fontSize: isMobile ? 14 : 16, marginTop: 8, textAlign: 'center'}}>{error}</div>}
        </form>
      </div>
    </div>
  )
}

export default function ManagePostsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const navigate = useNavigate()
  const [selectedPost, setSelectedPost] = useState(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        // companyId user-objektista localStoragesta
        let companyId = null
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}')
          companyId = user.companyId
        } catch (e) {
          // Ei companyId:tä userissa
        }
        // Lisää companyId query-paramiksi jos löytyy
        const url = companyId ? `/api/get-posts?companyId=${companyId}` : '/api/get-posts'
        const response = await axios.get(url)
        setPosts(response.data)
      } catch (err) {
        let msg = 'Virhe haettaessa dataa'
        if (err.response) {
          msg += ` (status: ${err.response.status} ${err.response.statusText})`
        } else if (err.request) {
          msg += ' (ei vastausta palvelimelta)'
        } else if (err.message) {
          msg += ` (${err.message})`
        }
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  // Uniikit tyypit
  const types = Array.from(new Set(posts.map(p => p.Type).filter(Boolean)))

  // Filtteröidyt postaukset
  const filteredPosts = typeFilter ? posts.filter(p => p.Type === typeFilter) : posts

  return (
    <div>
      <h1>Julkaisujen hallinta</h1>
      {/* Filtteripainikkeet */}
      {!loading && !error && types.length > 0 && (
        <div style={{display: 'flex', gap: 12, margin: '1.5rem 0'}}>
          <button
            onClick={() => setTypeFilter('')}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #e1e8ed',
              background: typeFilter === '' ? '#2563eb' : '#f7fafc',
              color: typeFilter === '' ? '#fff' : '#2563eb',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Kaikki
          </button>
          {types.map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: '1px solid #e1e8ed',
                background: typeFilter === type ? '#2563eb' : '#f7fafc',
                color: typeFilter === type ? '#fff' : '#2563eb',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}
      {loading && <p>Ladataan...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!loading && !error && filteredPosts.length === 0 && (
        <div style={{textAlign: 'center', marginTop: '3rem', color: '#2563eb', fontWeight: 600, fontSize: 22, opacity: 0.85}}>
          <span role="img" aria-label="valo">✨</span> Et ole vielä generoinut mitään julkaisuja
        </div>
      )}
      {!loading && !error && filteredPosts.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '2rem',
          marginTop: '2rem',
          width: '100%'
        }}>
          {Array.isArray(filteredPosts) && filteredPosts.map(post => (
            <div
              key={post.id}
              style={{
                background: '#fff',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                border: '1px solid #e1e8ed',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                minWidth: 0,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
              onClick={() => setSelectedPost(post)}
              onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.10)'}
              onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'}
            >
              {/* Kuva tai video */}
              {Array.isArray(post.Media) && post.Media.length > 0 ? (
                post.Media[0].type && post.Media[0].type.startsWith('video/') ? (
                  <video controls style={{width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12}}>
                    <source src={post.Media[0].url} type={post.Media[0].type} />
                    Selaimesi ei tue videon toistoa.
                  </video>
                ) : post.Media[0].type && post.Media[0].type.startsWith('image/') && post.Media[0].thumbnails && post.Media[0].thumbnails.large ? (
                  <img src={post.Media[0].thumbnails.large.url} alt="media" style={{width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12}} />
                ) : (
                  <img src="/placeholder.png" alt="placeholder" style={{width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12, background: '#f7fafc'}} />
                )
              ) : (
                <img src="/placeholder.png" alt="placeholder" style={{width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12, background: '#f7fafc'}} />
              )}
              {/* Tagit */}
              <div style={{display: 'flex', gap: 8, margin: '12px 16px 0 16px', flexWrap: 'wrap'}}>
                {post.Type && (
                  <span style={{background: '#e6f0fa', color: '#2563eb', fontSize: 12, borderRadius: 6, padding: '2px 8px', fontWeight: 500}}>{post.Type}</span>
                )}
                {/* Lisää kanavat tähän jos löytyy, esim. post.Channel */}
              </div>
              {/* Postauksen sisältö */}
              <div style={{padding: '12px 16px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column'}}>
                <div style={{fontWeight: 600, fontSize: 16, marginBottom: 6}}>{post.Idea}</div>
                <div style={{fontSize: 14, color: '#444', marginBottom: 8}}>{lyhenteleTeksti(post.Caption, 200)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modaalin renderöinti */}
      {selectedPost && <EditPostModal post={selectedPost} onClose={() => setSelectedPost(null)} onSave={() => setSelectedPost(null)} />}
    </div>
  )
} 