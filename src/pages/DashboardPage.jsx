import React, { useState } from 'react'

function EditPostModal({ post, onClose, onSave }) {
  const [idea, setIdea] = useState(post.Idea || '')
  const [caption, setCaption] = useState(post.Caption || '')
  const [publishDate, setPublishDate] = useState(post["Publish Date"] ? post["Publish Date"].slice(0, 16) : '') // yyyy-MM-ddTHH:mm
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const textareaRef = React.useRef(null)

  // Autoresize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [caption])

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
        "Publish Date": publishDate
      }
      const res = await fetch('https://samikiias.app.n8n.cloud/webhook/update-post1233214', {
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
    <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div style={{background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.18)', border: '1px solid #e1e8ed', padding: 40, maxWidth: 700, width: '95vw', position: 'relative', minHeight: 420}}>
        <button onClick={onClose} style={{position: 'absolute', top: 20, right: 20, background: '#f7fafc', border: '1px solid #e1e8ed', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 16}}>Sulje</button>
        {post.media && post.media.thumbnails && post.media.thumbnails.large ? (
          <img src={post.media.thumbnails.large.url} alt="media" style={{width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, marginBottom: 24}} />
        ) : null}
        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 20}}>
          <label style={{fontWeight: 600, fontSize: 17}}>
            Idea:
            <input type="text" value={idea} onChange={e => setIdea(e.target.value)} style={{width: '100%', borderRadius: 10, border: '1.5px solid #e1e8ed', padding: '14px 16px', marginTop: 6, fontSize: 17, background: '#f7fafc', transition: 'border 0.2s'}} />
          </label>
          <label style={{fontWeight: 600, fontSize: 17}}>
            Julkaisu:
            <textarea ref={textareaRef} value={caption} onChange={e => setCaption(e.target.value)} style={{width: '100%', borderRadius: 10, border: '1.5px solid #e1e8ed', padding: '14px 16px', marginTop: 6, minHeight: 90, fontSize: 16, background: '#f7fafc', transition: 'border 0.2s', resize: 'none', overflow: 'hidden'}} />
          </label>
          <label style={{fontWeight: 600, fontSize: 17}}>
            Julkaisupäivä:
            <input type="datetime-local" value={publishDate} onChange={e => setPublishDate(e.target.value)} style={{width: '100%', borderRadius: 10, border: '1.5px solid #e1e8ed', padding: '14px 16px', marginTop: 6, fontSize: 16, background: '#f7fafc', transition: 'border 0.2s'}} />
          </label>
          <button type="submit" disabled={saving} style={{background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 0', fontWeight: 700, fontSize: 18, cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8}}>
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </button>
          {success && <div style={{color: '#2e7d32', fontWeight: 600, fontSize: 16, marginTop: 8, textAlign: 'center'}}>Tallennus onnistui!</div>}
          {error && <div style={{color: '#e53e3e', fontWeight: 600, fontSize: 16, marginTop: 8, textAlign: 'center'}}>{error}</div>}
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
      <div className="dashboard-header" style={{padding: '32px 0 16px 0'}}>
        <h1 style={{marginBottom: 12}}>Kojelauta</h1>
        <p className="dashboard-welcome" style={{marginBottom: 0, fontSize: 18, color: '#444'}}>Tervetuloa takaisin! Tässä näet markkinointikampanjoidesi tilanteen.</p>
      </div>
      <div className="stats-row" style={{gap: 32, marginBottom: 32}}>
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.totalUpcomingPosts}</div>
          <div className="stat-label">Tulevat postaukset</div>
          <div className="stat-desc">Seuraavat 7 päivää</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{dashboardData.nextGenerationTime ? formatDate(dashboardData.nextGenerationTime) : '-'}</div>
          <div className="stat-label">Seuraava generointi</div>
          <div className="stat-desc">{dashboardData.nextGenerationTime ? formatDateTime(dashboardData.nextGenerationTime).split(' ')[1] : ''}</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{dashboardData.emails.length}</div>
          <div className="stat-label">Lähtevät sähköpostit</div>
          <div className="stat-desc">Odottaa lähetystä</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{dashboardData.stats.averageOpenRate ? (dashboardData.stats.averageOpenRate * 100).toFixed(1) + '%': '-'}</div>
          <div className="stat-label">Sitoutumisaste</div>
          <div className="stat-desc">+3% viime kuusta</div>
        </div>
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-section">
          <h2 className="section-title">Tulevat postaukset ja sähköpostit</h2>
          <div className="section-list">
            {dashboardData.upcomingPosts.map(post => (
              <div key={post.id} className="section-card post-card" style={{display: 'flex', alignItems: 'center', gap: 16, position: 'relative'}}>
                {post.media && post.media.thumbnails && post.media.thumbnails.large ? (
                  <img src={post.media.thumbnails.large.url} alt="media" style={{width: 64, height: 64, objectFit: 'cover', borderRadius: 8}} />
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
        <section className="dashboard-section">
          <h2 className="section-title">Tulevat tehtävät</h2>
          <div className="section-list">
            <div className="section-card task-card">
              <div className="task-title">Tarkista aikataulutetut postaukset</div>
              <div className="task-time">Tänään, 15:00</div>
              <div className="task-priority urgent">kiireellinen</div>
            </div>
            <div className="section-card task-card">
              <div className="task-title">Valmistele viikkolehti</div>
              <div className="task-time">Huomenna, 10:00</div>
              <div className="task-priority normal">normaali</div>
            </div>
            <div className="section-card task-card">
              <div className="task-title">Päivitä sisältökalenteri</div>
              <div className="task-time">20.6., 14:00</div>
              <div className="task-priority low">matala</div>
            </div>
            <div className="section-card task-card">
              <div className="task-title">Analysoi kampanjan suorituskyky</div>
              <div className="task-time">22.6., 09:00</div>
              <div className="task-priority normal">normaali</div>
            </div>
          </div>
        </section>
      </div>
      {editPost && <EditPostModal post={editPost} onClose={() => setEditPost(null)} onSave={handleSave} />}
    </>
  )
} 