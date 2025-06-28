import React, { useState } from 'react'
import { Trans, t } from '@lingui/macro'

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

export default function DashboardPage({ dashboardData, formatDate, formatDateTime }) {
  const [editPost, setEditPost] = useState(null)
  const handleSave = (updatedPost) => {
    // TODO: Tallenna muutokset backendille
    setEditPost(null)
    // Voit päivittää dashboardDataa tässä jos haluat näyttää muutokset heti
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
        <h1 style={{margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: -0.5, lineHeight: 1.2}}><Trans>Kojelauta</Trans></h1>
        <p style={{margin: '8px 0 0 0', fontSize: 16, color: '#cbd5e1', fontWeight: 400}}><Trans>Tervetuloa takaisin! Tässä näet markkinointikampanjoidesi tilanteen.</Trans></p>
      </div>
      <div style={{maxWidth: 900, padding: '0 8px'}}>
        <div className="stats-row" style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '1.5rem',
          margin: '32px 0 2rem 0',
          width: 'auto',
          justifyContent: 'flex-start',
          alignItems: 'stretch'
        }}>
          <div className="stat-card" style={{flex: '0 0 180px', width: 180, height: 150, background: '#fff', border: '1px solid #e1e8ed', borderRadius: 12, padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 0}}>
            <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{dashboardData.stats.totalUpcomingPosts}</div>
            <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500}}><Trans>Tulevat postaukset</Trans></div>
            <div className="stat-desc" style={{fontSize: 13, color: '#888', marginTop: 4}}><Trans>Seuraavat 7 päivää</Trans></div>
          </div>
          <div className="stat-card" style={{flex: '0 0 180px', width: 180, height: 150, background: '#fff', border: '1px solid #e1e8ed', borderRadius: 12, padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 0}}>
            <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{dashboardData.nextGenerationTime ? formatDate(dashboardData.nextGenerationTime) : '-'}</div>
            <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500}}><Trans>Seuraava generointi</Trans></div>
            <div className="stat-desc" style={{fontSize: 13, color: '#888', marginTop: 4}}>{dashboardData.nextGenerationTime ? formatDateTime(dashboardData.nextGenerationTime).split(' ')[1] : ''}</div>
          </div>
          <div className="stat-card" style={{flex: '0 0 180px', width: 180, height: 150, background: '#fff', border: '1px solid #e1e8ed', borderRadius: 12, padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 0}}>
            <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{dashboardData.emails.length}</div>
            <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500}}><Trans>Lähtevät sähköpostit</Trans></div>
            <div className="stat-desc" style={{fontSize: 13, color: '#888', marginTop: 4}}><Trans>Odottaa lähetystä</Trans></div>
          </div>
          <div className="stat-card" style={{flex: '0 0 180px', width: 180, height: 150, background: '#fff', border: '1px solid #e1e8ed', borderRadius: 12, padding: '1.5rem', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minWidth: 0}}>
            <div className="stat-number" style={{fontSize: '2rem', fontWeight: 700, color: '#667eea', marginBottom: '0.5rem'}}>{dashboardData.stats.averageOpenRate ? (dashboardData.stats.averageOpenRate * 100).toFixed(1) + '%' : '-'}</div>
            <div className="stat-label" style={{fontSize: '0.9rem', color: '#718096', fontWeight: 500}}><Trans>Sitoutumisaste</Trans></div>
            <div className="stat-desc" style={{fontSize: 13, color: '#888', marginTop: 4}}><Trans>+3% viime kuusta</Trans></div>
          </div>
        </div>
        <div className="dashboard-columns">
          <section className="dashboard-section" style={{width: 588, minWidth: 588, maxWidth: 588}}>
            <h2 className="section-title">Tulevat postaukset</h2>
            <div className="section-list">
              {dashboardData.upcomingPosts.map(post => (
                <div key={post.id} className="section-card post-card" style={{display: 'flex', alignItems: 'center', gap: 16, position: 'relative'}}>
                  {/* Media: video, kuva tai placeholder */}
                  {Array.isArray(post.Media) && post.Media.length > 0 ? (
                    post.Media[0].type && post.Media[0].type.startsWith('video/') ? (
                      <video controls style={{width: 64, height: 64, objectFit: 'cover', borderRadius: 8}}>
                        <source src={post.Media[0].url} type={post.Media[0].type} />
                        Selaimesi ei tue videon toistoa.
                      </video>
                    ) : post.Media[0].type && post.Media[0].type.startsWith('image/') && post.Media[0].thumbnails && post.Media[0].thumbnails.large ? (
                      <img src={post.Media[0].thumbnails.large.url} alt="media" style={{width: 64, height: 64, objectFit: 'cover', borderRadius: 8}} />
                    ) : (
                      <div style={{width: 64, height: 64, background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', borderRadius: 8}}>Ei kuvaa</div>
                    )
                  ) : (
                    <div style={{width: 64, height: 64, background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', borderRadius: 8}}>Ei kuvaa</div>
                  )}
                  <div style={{flex: 1}}>
                    <div className="post-title" style={{fontWeight: 600, fontSize: 16, marginBottom: 4}}>{post.Idea || post.title}</div>
                    <div className="post-desc" style={{fontSize: 14, color: '#444', marginBottom: 4}}>{post.desc.length > 120 ? post.desc.slice(0, 120) + '…' : post.desc}</div>
                    <div className="post-time" style={{fontSize: 13, color: '#888', marginBottom: 4}}>{post.date ? formatDateTime(post.date) : '-'}</div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                    <button onClick={() => setEditPost(post)} style={{background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 18px', fontWeight: 600, cursor: 'pointer', margin: 0}}>Muokkaa</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {editPost && <EditPostModal post={editPost} onClose={() => setEditPost(null)} onSave={handleSave} />}
    </>
  )
} 