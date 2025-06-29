import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import PageHeader from '../components/PageHeader'

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
        const companyId = JSON.parse(localStorage.getItem('user') || 'null')?.companyId
        const url = `/api/get-posts${companyId ? `?companyId=${companyId}` : ''}`
        const response = await axios.get(url)
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
      <PageHeader title="Julkaisujen hallinta" />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 8px' }}>
        {/* Filtteripainikkeet */}
        {!loading && !error && types.length > 0 && (
          <div style={{display: 'flex', gap: 12, margin: '1.5rem 0'}}>
            <button
              onClick={() => setTypeFilter('')}
              style={{
                padding: '6px 16px',
                borderRadius: 8,
                border: 'none',
                background: typeFilter === '' ? '#2563eb' : '#f7fafc',
                color: typeFilter === '' ? '#fff' : '#2563eb',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: typeFilter === '' ? '0 2px 8px rgba(37,99,235,0.08)' : 'none',
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
                  borderRadius: 8,
                  border: 'none',
                  background: typeFilter === type ? '#2563eb' : '#f7fafc',
                  color: typeFilter === type ? '#fff' : '#2563eb',
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: typeFilter === type ? '0 2px 8px rgba(37,99,235,0.08)' : 'none',
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
          <div style={{display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'}}>
            {filteredPosts.map((post, index) => (
              <div key={post.id || index} style={{
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                border: '1px solid #e5e7eb',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 340,
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Media-kuva tai placeholder */}
                {post.Media && Array.isArray(post.Media) && post.Media[0] && post.Media[0].url ? (
                  <img
                    src={post.Media[0].url}
                    alt={post.Idea || post.title || 'Julkaisukuva'}
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      background: '#f3f4f6',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div style={{
                    background: '#f3f4f6',
                    color: '#b0b0b0',
                    height: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 500
                  }}>
                    Ei kuvaa
                  </div>
                )}
                <div style={{padding: 20, flex: 1, display: 'flex', flexDirection: 'column'}}>
                  {/* Tyyppibadge */}
                  {post.Type && (
                    <span style={{
                      display: 'inline-block',
                      background: '#f1f5f9',
                      color: '#2563eb',
                      fontWeight: 600,
                      fontSize: 14,
                      borderRadius: 8,
                      padding: '2px 12px',
                      marginBottom: 10
                    }}>{post.Type}</span>
                  )}
                  {/* Otsikko */}
                  <div style={{fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#1f2937'}}>
                    {post.Idea || post.title || 'Ei otsikkoa'}
                  </div>
                  {/* Kuvaus */}
                  <div style={{color: '#374151', fontSize: 15, marginBottom: 12, flex: 1}}>
                    {post.Caption || post.desc || 'Ei kuvausta'}
                  </div>
                  {/* Julkaisupäivä ja linkki */}
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto'}}>
                    <span style={{fontSize: 13, color: '#9ca3af'}}>
                      {post["Publish Date"] ? `Julkaistu: ${formatDate(post["Publish Date"])} ` : ''}
                    </span>
                    <Link 
                      to={`/posts/${post.id}`}
                      style={{
                        padding: '8px 16px',
                        background: '#2563eb',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: 8,
                        fontSize: 14,
                        fontWeight: 600
                      }}
                    >
                      Katso tiedot
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
} 