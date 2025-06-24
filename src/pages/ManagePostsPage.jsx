import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function lyhenteleTeksti(teksti, max = 100) {
  if (!teksti) return ''
  return teksti.length > max ? teksti.slice(0, max) + '…' : teksti
}

function PostDetailsModal({ post, onClose }) {
  React.useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
  if (!post) return null
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
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
        border: '1px solid #e1e8ed',
        padding: 32,
        maxWidth: 600,
        width: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        <button onClick={onClose} style={{position: 'absolute', top: 16, right: 16, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 6, padding: '6px 16px', cursor: 'pointer'}}>Sulje</button>
        <h2 style={{marginBottom: 16}}>Postauksen tiedot</h2>
        {Array.isArray(post.Media) && post.Media.length > 0 && post.Media[0].thumbnails && post.Media[0].thumbnails.large ? (
          <img src={post.Media[0].thumbnails.large.url} alt="media" style={{width: '100%', height: 240, objectFit: 'cover', borderRadius: 8, marginBottom: 16}} />
        ) : null}
        <div style={{marginBottom: 12}}><b>ID:</b> {post.id}</div>
        <div style={{marginBottom: 12}}><b>Idea:</b> {post.Idea}</div>
        <div style={{marginBottom: 12}}><b>Kuvaus:</b> {post.Caption}</div>
        <div style={{marginBottom: 12}}><b>Tyyppi:</b> {post.Type}</div>
        <div style={{marginBottom: 12}}><b>Status:</b> {post.Status}</div>
        <div style={{marginBottom: 12}}><b>Luotu:</b> {post.createdTime ? new Date(post.createdTime).toLocaleString('fi-FI') : '-'}</div>
        {/* Lisää muita kenttiä tarpeen mukaan */}
        <pre style={{background: '#f7fafc', padding: 12, borderRadius: 6, fontSize: 13, marginTop: 24}}>{JSON.stringify(post, null, 2)}</pre>
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
        const response = await axios.get('https://samikiias.app.n8n.cloud/webhook/get-rascalai-posts123890')
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
      {!loading && !error && (
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
              {/* Kuva */}
              {Array.isArray(post.Media) && post.Media.length > 0 && post.Media[0].thumbnails && post.Media[0].thumbnails.large ? (
                <img src={post.Media[0].thumbnails.large.url} alt="media" style={{width: '100%', height: 180, objectFit: 'cover', borderTopLeftRadius: 12, borderTopRightRadius: 12}} />
              ) : (
                <div style={{width: '100%', height: 180, background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb'}}>Ei kuvaa</div>
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
      {selectedPost && <PostDetailsModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
    </div>
  )
} 