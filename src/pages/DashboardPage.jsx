import React from 'react'

export default function DashboardPage({ dashboardData, formatDate, formatDateTime }) {
  return (
    <>
      <div className="dashboard-header">
        <h1>Kojelauta</h1>
        <p className="dashboard-welcome">Tervetuloa takaisin! Tässä näet markkinointikampanjoidesi tilanteen.</p>
      </div>
      <div className="stats-row">
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
              <div key={post.id} className="section-card post-card" style={{display: 'flex', alignItems: 'flex-start', gap: 16}}>
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
                <button onClick={() => window.location.href = `/posts/${post.id}`} style={{background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer'}}>Muokkaa</button>
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
    </>
  )
} 