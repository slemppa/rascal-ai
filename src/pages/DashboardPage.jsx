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
          <div className="stat-number">{dashboardData.stats.totalSubscribers}</div>
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
              <div key={post.id} className="section-card post-card">
                <div className="post-title">{post.title}</div>
                <div className="post-channel">Instagram</div>
                <div className="post-time">{formatDateTime(post.date)}</div>
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