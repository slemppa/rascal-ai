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
    <div style={{padding: 32}}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none',
        border: 'none',
        color: '#2563eb',
        cursor: 'pointer',
        fontSize: 16,
        marginBottom: 24
      }}>
        ← Takaisin
      </button>
      
      <div style={{background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}}>
        <h1 style={{margin: '0 0 16px 0', fontSize: 24, fontWeight: 700}}>
          {post.Idea || post.title || 'Ei otsikkoa'}
        </h1>
        
        <div style={{marginBottom: 16}}>
          <strong>Julkaisupäivä:</strong> {post["Publish Date"] ? new Date(post["Publish Date"]).toLocaleDateString('fi-FI') : 'Ei määritelty'}
        </div>
        
        <div style={{marginBottom: 16}}>
          <strong>Kuvaus:</strong>
          <p style={{margin: '8px 0 0 0', lineHeight: 1.6}}>
            {post.Caption || post.desc || 'Ei kuvausta'}
          </p>
        </div>
        
        {post.Media && post.Media.length > 0 && (
          <div style={{marginBottom: 16}}>
            <strong>Media:</strong>
            <div style={{marginTop: 8}}>
              {post.Media.map((media, index) => (
                <div key={index} style={{marginBottom: 8}}>
                  {media.type && media.type.startsWith('image/') ? (
                    <img src={media.url} alt="media" style={{maxWidth: '100%', borderRadius: 8}} />
                  ) : media.type && media.type.startsWith('video/') ? (
                    <video controls style={{maxWidth: '100%', borderRadius: 8}}>
                      <source src={media.url} type={media.type} />
                      Selaimesi ei tue videon toistoa.
                    </video>
                  ) : (
                    <a href={media.url} target="_blank" rel="noopener noreferrer" style={{color: '#2563eb'}}>
                      Avaa media
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
  )
} 