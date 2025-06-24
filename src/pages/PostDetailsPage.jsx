import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

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
    <div style={{maxWidth: 600, margin: '2rem auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', border: '1px solid #e1e8ed', padding: 32}}>
      <button onClick={() => navigate(-1)} style={{marginBottom: 16, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 6, padding: '6px 16px', cursor: 'pointer'}}>Takaisin</button>
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
  )
} 