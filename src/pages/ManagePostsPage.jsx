import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

export default function ManagePostsPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get('https://samikiias.app.n8n.cloud/webhook/get-rascalai-posts123890')
        setPosts(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setError('Virhe haettaessa julkaisuja')
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  // Hae uniikit tyypit
  const types = [...new Set(posts.map(post => post.Type).filter(Boolean))]

  // Suodata julkaisut tyypin mukaan
  const filteredPosts = typeFilter 
    ? posts.filter(post => post.Type === typeFilter)
    : posts

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('fi-FI')
    } catch {
      return dateString
    }
  }

  return (
    <>
      <div style={{
        background: 'var(--brand-dark)',
        color: '#fff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 32,
        paddingBottom: 24
      }}>
        <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}>Julkaisujen hallinta</h1>
      </div>
      <div style={{width: '100%', padding: '0 8px', overflowX: 'auto', paddingBottom: 48}}>
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
          <div style={{display: 'grid', gap: 16}}>
            {filteredPosts.map((post, index) => (
              <div key={post.id || index} style={{
                background: '#fff',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12}}>
                  <div style={{flex: 1}}>
                    <h3 style={{margin: '0 0 8px 0', fontSize: 18, fontWeight: 600, color: '#1f2937'}}>
                      {post.Idea || post.title || 'Ei otsikkoa'}
                    </h3>
                    <p style={{margin: '0 0 8px 0', color: '#6b7280', fontSize: 14, lineHeight: 1.5}}>
                      {post.Caption || post.desc || 'Ei kuvausta'}
                    </p>
                    <div style={{display: 'flex', gap: 16, fontSize: 12, color: '#9ca3af'}}>
                      <span>Tyyppi: {post.Type || '-'}</span>
                      <span>Tila: {post.Status || '-'}</span>
                      <span>Julkaistu: {formatDate(post["Publish Date"])}</span>
                    </div>
                  </div>
                  <Link 
                    to={`/posts/${post.id}`}
                    style={{
                      padding: '8px 16px',
                      background: '#2563eb',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: 6,
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    Katso tiedot
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
} 