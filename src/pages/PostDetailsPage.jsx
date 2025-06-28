import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Trans } from '@lingui/macro'

export default function PostDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await axios.get('https://samikiias.app.n8n.cloud/webhook/get-rascalai-posts123890')
        const found = Array.isArray(response.data) ? response.data.find(p => p.id === id) : null
        setPost(found)
      } catch (err) {
        setError('Virhe haettaessa postauksen tietoja')
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  if (loading) return <p>Ladataan...</p>
  if (error) return <p style={{color: 'red'}}>{error}</p>
  if (!post) return <p>Postausta ei löytynyt.</p>

  return (
    <>
      <div style={{
        background: 'var(--brand-dark)',
        color: '#fff',
        borderBottom: '1px solid #e2e8f0',
        paddingTop: 32,
        paddingBottom: 24
      }}>
        <h2 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}><Trans>Postauksen tiedot</Trans></h2>
      </div>
      <div style={{maxWidth: 800, padding: '0 8px'}}>
        <button onClick={() => navigate(-1)} style={{marginBottom: 16, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 6, padding: '6px 16px', cursor: 'pointer'}}><Trans>Takaisin</Trans></button>
        {Array.isArray(post.Media) && post.Media.length > 0 && post.Media[0].thumbnails && post.Media[0].thumbnails.large ? (
          <img src={post.Media[0].thumbnails.large.url} alt="media" style={{width: '100%', height: 240, objectFit: 'cover', borderRadius: 8, marginBottom: 16}} />
        ) : null}
        <div style={{marginBottom: 12}}><b><Trans>ID:</Trans></b> {post.id}</div>
        <div style={{marginBottom: 12}}><b><Trans>Idea:</Trans></b> {post.Idea}</div>
        <div style={{marginBottom: 12}}><b><Trans>Kuvaus:</Trans></b> {post.Caption}</div>
        <div style={{marginBottom: 12}}><b><Trans>Tyyppi:</Trans></b> {post.Type}</div>
        <div style={{marginBottom: 12}}><b><Trans>Status:</Trans></b> {post.Status}</div>
        <div style={{marginBottom: 12}}><b><Trans>Luotu:</Trans></b> {post.createdTime ? new Date(post.createdTime).toLocaleString('fi-FI') : '-'}</div>
        {/* Lisää muita kenttiä tarpeen mukaan */}
        <pre style={{background: '#f7fafc', padding: 12, borderRadius: 6, fontSize: 13, marginTop: 24}}>{JSON.stringify(post, null, 2)}</pre>
      </div>
    </>
  )
} 