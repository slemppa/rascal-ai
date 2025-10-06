import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import axios from 'axios'
// Analytics data haetaan nyt iframe:n kautta
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ZAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabase'
import styles from './DashboardPage.module.css'
import { useAuth } from '../contexts/AuthContext'
import PageMeta from '../components/PageMeta'
// Analytics poistettu - tehdään myöhemmin
import '../components/ModalComponents.css'

function EditPostModal({ post, onClose, onSave }) {
  const { t } = useTranslation('common')
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
    if (textareaRef.current && textareaRef.current.style) {
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
      if (!res.ok) throw new Error(t('dashboard.edit.saveError'))
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSave(payload)
      }, 1200)
    } catch (err) {
      setError(t('dashboard.edit.saveError'))
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
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: isMobile ? 20 : 32,
        maxWidth: isMobile ? '100%' : 600,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>{t('dashboard.edit.title')}</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: '#6b7280'
          }}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>{t('dashboard.edit.ideaLabel')}</label>
            <textarea
              ref={textareaRef}
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder={t('dashboard.edit.ideaPlaceholder')}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>{t('dashboard.edit.captionLabel')}</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              placeholder={t('dashboard.edit.captionPlaceholder')}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, color: '#374151' }}>{t('dashboard.edit.publishDateLabel')}</label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: 14
              }}
            />
          </div>
          
          {error && (
            <div style={{
              padding: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              color: '#dc2626',
              fontSize: 14
            }}>
              {error || t('dashboard.edit.saveError')}
            </div>
          )}
          
          {success && (
            <div style={{
              padding: 12,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 8,
              color: '#16a34a',
              fontSize: 14
            }}>
              {t('dashboard.edit.saveSuccess')}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {t('dashboard.edit.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 8,
                background: '#2563eb',
                color: '#fff',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: saving ? 0.7 : 1
              }}
            >
            {saving ? t('dashboard.edit.saving') : t('dashboard.edit.save')}
          </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation('common')
  // Analytics data haetaan nyt iframe:n kautta
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [imagesUploaded, setImagesUploaded] = useState(false) // Status kuvien lähettämisestä
  const [audioUploaded, setAudioUploaded] = useState(false) // Status äänen lähettämisestä
  const [selectedImages, setSelectedImages] = useState([]) // Valitut kuvat
  const [selectedAudio, setSelectedAudio] = useState(null) // Valittu äänitiedosto
  const [dragActiveImages, setDragActiveImages] = useState(false)
  const [dragActiveAudio, setDragActiveAudio] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false) // Loading state
  const [avatarError, setAvatarError] = useState('') // Error state
  const imagesDropRef = React.useRef(null)
  const audioDropRef = React.useRef(null)
  const [totalCallPrice, setTotalCallPrice] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsData, setStatsData] = useState({
    upcomingCount: 0,
    monthlyCount: 0,
    totalCallPrice: 0,
    totalMessagePrice: 0,
    features: [],
    aiUsage: 0
  })
  
  // Stats data trendeillä - käytetään oikeita tietoja
  const dashboardStats = [
    { 
      label: t('dashboard.metrics.stats.upcomingPosts'), 
      value: statsData.upcomingCount || 0, 
      trend: 12.5, 
      color: '#cea78d' 
    },
    { 
      label: t('dashboard.metrics.stats.publishedContent'), 
      value: statsData.monthlyCount || 0, 
      trend: -5.2, 
      color: '#cea78d' 
    },
    { 
      label: t('dashboard.metrics.stats.messageCosts'), 
      value: statsData.totalMessagePrice ? `€${statsData.totalMessagePrice.toFixed(2)}` : '€0.00', 
      trend: 8.7, 
      color: '#cea78d' 
    },
    { 
      label: t('dashboard.metrics.stats.callCosts'), 
      value: statsData.totalCallPrice ? `€${statsData.totalCallPrice.toFixed(2)}` : '€0.00', 
      trend: 15.3, 
      color: '#cea78d' 
    }
  ]
  const [schedule, setSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const [socialAccounts, setSocialAccounts] = useState([]) // Supabase social accounts
  const { user } = useAuth()
  const [imageModalUrl, setImageModalUrl] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('7days')
  // Analytics filtteröinnit käsitellään iframe:ssä

  // Chart data - käytetään oikeita tietoja Supabase:sta
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(true)
  const [successStats, setSuccessStats] = useState({ total: 0, answered: 0, success: 0, answerRate: 0, successRate: 0, perDay: [] })
  const [campaignMetrics, setCampaignMetrics] = useState([])
  const [scatterData, setScatterData] = useState([])
  const [heatmapData, setHeatmapData] = useState([])
  
  // Hae chart data Supabase:sta
  const fetchChartData = async (timeFilter) => {
    if (!user) return
    
    setChartLoading(true)
    
    try {
      // Hae käyttäjän user_id ensin
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()
      
      if (!userRow) return
      
      const userId = userRow.id
      const now = new Date()
      let startDate
      
      if (timeFilter === '7days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      
      // Hae puhelut
      const { data: calls } = await supabase
        .from('call_logs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
      
      // Hae viestit
      const { data: messages } = await supabase
        .from('message_logs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
      
      // Ryhmittele data päivien mukaan
      const groupedData = {}
      
      // Alusta päivät
      if (timeFilter === '7days') {
        const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
        const today = now.getDay()
        for (let i = 6; i >= 0; i--) {
          const dayIndex = (today - i + 7) % 7
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayKey = days[dayIndex]
          groupedData[dayKey] = { date: dayKey, calls: 0, messages: 0 }
        }
      } else {
        // 30 päivää - viikoittain
        for (let i = 29; i >= 0; i -= 7) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const weekKey = `${date.getDate()}.${date.getMonth() + 1}`
          groupedData[weekKey] = { date: weekKey, calls: 0, messages: 0 }
        }
      }
      
      // Laske puhelut päivittäin
      if (calls) {
        calls.forEach(call => {
          const callDate = new Date(call.created_at)
          if (timeFilter === '7days') {
            const dayIndex = callDate.getDay()
            const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
            const dayKey = days[dayIndex]
            if (groupedData[dayKey]) {
              groupedData[dayKey].calls++
            }
          } else {
            // 30 päivää - viikoittain
            const weekStart = new Date(callDate.getTime() - callDate.getDay() * 24 * 60 * 60 * 1000)
            const weekKey = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`
            if (groupedData[weekKey]) {
              groupedData[weekKey].calls++
            }
          }
        })
      }
      
      // Laske viestit päivittäin
      if (messages) {
        messages.forEach(message => {
          const messageDate = new Date(message.created_at)
          if (timeFilter === '7days') {
            const dayIndex = messageDate.getDay()
            const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
            const dayKey = days[dayIndex]
            if (groupedData[dayKey]) {
              groupedData[dayKey].messages++
            }
          } else {
            // 30 päivää - viikoittain
            const weekStart = new Date(messageDate.getTime() - messageDate.getDay() * 24 * 60 * 60 * 1000)
            const weekKey = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`
            if (groupedData[weekKey]) {
              groupedData[weekKey].messages++
            }
          }
        })
      }
      
      // Muunna objektista array:ksi ja järjestä
      const sortedData = Object.values(groupedData).sort((a, b) => {
        if (timeFilter === '7days') {
          const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
          return days.indexOf(a.date) - days.indexOf(b.date)
        } else {
          return a.date.localeCompare(b.date)
        }
      })
      
      setChartData(sortedData)
    } catch (error) {
      console.error('Virhe haettaessa chart dataa:', error)
      // Fallback dummy data jos virhe
      setChartData([
        { date: 'Ma', calls: 0, messages: 0 },
        { date: 'Ti', calls: 0, messages: 0 },
        { date: 'Ke', calls: 0, messages: 0 },
        { date: 'To', calls: 0, messages: 0 },
        { date: 'Pe', calls: 0, messages: 0 },
        { date: 'La', calls: 0, messages: 0 },
        { date: 'Su', calls: 0, messages: 0 }
      ])
    } finally {
      setChartLoading(false)
    }
  }
  
  // Päivitä chartData kun aikaväli muuttuu
  useEffect(() => {
    fetchChartData(selectedTimeFilter)
  }, [selectedTimeFilter, user])

  // Hae onnistumisanalytiikka backendistä
  useEffect(() => {
    const fetchSuccess = async () => {
      if (!user) return
      try {
        const session = await supabase.auth.getSession()
        const token = session?.data?.session?.access_token
        if (!token) return
        const days = selectedFilter === 'week' ? 7 : selectedFilter === 'month' ? 30 : 30
        const res = await fetch(`/api/dashboard-success?days=${encodeURIComponent(days)}`, { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (res.ok) setSuccessStats(json)
      } catch (e) {
        console.error('Dashboard: Error fetching success stats:', e)
      }
    }
    fetchSuccess()
  }, [user, selectedFilter])

  // Hae scatter- ja heatmap-data backendistä
  useEffect(() => {
    const fetchAdvanced = async () => {
      if (!user) return
      try {
        const session = await supabase.auth.getSession()
        const token = session?.data?.session?.access_token
        if (!token) return
        const [scRes, hmRes] = await Promise.all([
          fetch(`/api/dashboard-calls-scatter?days=30`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/dashboard-calls-heatmap?days=30`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        const scJson = await scRes.json().catch(() => [])
        const hmJson = await hmRes.json().catch(() => [])
        if (Array.isArray(scJson)) setScatterData(scJson)
        if (Array.isArray(hmJson)) setHeatmapData(hmJson)
      } catch (_) {}
    }
    fetchAdvanced()
  }, [user])

  // Hae kampanjametriikat backendista (nimi, puhelut, onnistumis%)
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return
      try {
        const session = await supabase.auth.getSession()
        const token = session?.data?.session?.access_token
        if (!token) return
        const res = await fetch(`/api/campaigns?user_id=${encodeURIComponent(user.id)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const json = await res.json()
        if (!res.ok || !Array.isArray(json)) {
          setCampaignMetrics([])
          return
        }
        const rows = json.map(c => {
          const total = Number(c.total_calls || 0)
          const success = Number(c.successful_calls || 0)
          const successRate = total > 0 ? Math.round((success / total) * 100) : 0
          return { id: c.id, name: c.name, total, successRate }
        })
        setCampaignMetrics(rows)
      } catch (_) {
        setCampaignMetrics([])
      }
    }
    fetchCampaigns()
  }, [user])

  // Platform värit
  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return '#e4405f'
      case 'facebook': return '#1877f2'
      case 'tiktok': return '#000000'
      case 'twitter': return '#1da1f2'
      case 'linkedin': return '#0a66c2'
      default: return '#6b7280'
    }
  }

  useEffect(() => {
    if (!imageModalUrl) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setImageModalUrl(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageModalUrl])

  // Responsiivinen apu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError(null)
      
      // Hae käyttäjän user_id ensin
      let userId = null
      if (user) {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        userId = userRow?.id
      }
      
      // Hakee kirjautuneen käyttäjän postaukset - vain käyttäjän omat
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userId)
        .order('publish_date', { ascending: false })
      if (error) setError('Virhe haettaessa julkaisuja')
      setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [user])

  useEffect(() => {
    const fetchCallPrice = async () => {
      // Hae käyttäjän user_id ensin
      let userId = null
      if (user) {
        const { data: userRow } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        userId = userRow?.id
      }

      // Hae kuluvan kuukauden puheluiden kokonaishinta - vain käyttäjän omat
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const { data, error } = await supabase
        .from('call_logs')
        .select('price')
        .eq('user_id', userId)
        .gte('call_date', firstDay.toISOString())
        .lte('call_date', lastDay.toISOString())
      if (!error && data) {
        const sum = data.reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)
        setTotalCallPrice(sum)
      } else {
        setTotalCallPrice(0)
      }
    }
    fetchCallPrice()
  }, [user])

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setStatsLoading(false)
        return
      }

      setStatsLoading(true)
      try {
        // Hae käyttäjän user_id ensin
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id, features')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userRow?.id) {
          console.error('User not found:', userError)
          setStatsLoading(false)
          return
        }

        // Haetaan oikea user_id users taulusta (sama logiikka kuin posts-sivulla)
        const { data: userData, error: userDataError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()
        
        if (userDataError || !userData?.id) {
          console.error('User data not found:', userDataError)
          setStatsLoading(false)
          return
        }
        
        const userId = userData.id
        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        
        console.log('Dashboard stats calculation:', {
          authUserId: user.id,
          userId,
          firstDay: firstDay.toISOString(),
          now: now.toISOString()
        })

        // Hae kaikki tiedot rinnakkain
        const [
          { count: upcomingCount, error: upcomingError },
          { count: monthlyCount, error: monthlyError },
          { data: callData, error: callError },
          { data: messageData, error: messageError },
          { count: aiUsage, error: aiError }
        ] = await Promise.all([
          supabase
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Scheduled')
            .eq('user_id', userId),
          supabase
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', firstDay.toISOString()),
          supabase
            .from('call_logs')
            .select('price')
            .eq('user_id', userId)
            .gte('call_date', firstDay.toISOString()),
          supabase
            .from('message_logs')
            .select('price')
            .eq('user_id', userId)
            .gte('created_at', firstDay.toISOString())
            .not('price', 'is', null),
          supabase
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', firstDay.toISOString())
        ])

        // Käsittele virheet
        if (upcomingError) console.error('Error fetching upcoming posts:', upcomingError)
        if (monthlyError) console.error('Error fetching monthly posts:', monthlyError)
        if (callError) console.error('Error fetching call data:', callError)
        if (messageError) console.error('Error fetching message data:', messageError)
        if (aiError) console.error('Error fetching AI usage:', aiError)

        // Laske hinnat
        const totalCallPrice = (callData || []).reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)
        const totalMessagePrice = (messageData || []).reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)

        console.log('Dashboard stats results:', {
          upcomingCount,
          monthlyCount,
          totalCallPrice,
          totalMessagePrice,
          aiUsage
        })
        
        setStatsData({
          upcomingCount: upcomingCount || 0,
          monthlyCount: monthlyCount || 0,
          totalCallPrice: totalCallPrice || 0,
          totalMessagePrice: totalMessagePrice || 0,
          features: userRow.features || [],
          aiUsage: aiUsage || 0
        })
      } catch (e) {
        console.error('Error fetching stats:', e)
        setError('Virhe tilastojen lataamisessa')
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [user])

  // Hae käyttäjän social accounts Supabasesta
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!user?.id) return
      
      try {
        const { data, error } = await supabase
          .from('user_social_accounts')
          .select('mixpost_account_uuid, provider, account_name, username, profile_image_url')
          .eq('user_id', user.id)
          .eq('is_authorized', true)
        
        if (error) {
          console.error('Error fetching social accounts:', error)
          return
        }
        
        setSocialAccounts(data || [])
        console.log('Fetched social accounts:', data)
      } catch (error) {
        console.error('Error fetching social accounts:', error)
      }
    }
    fetchSocialAccounts()
  }, [user?.id])

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user) {
        setSchedule([])
        setScheduleLoading(false)
        return
      }

      setScheduleLoading(true)
      try {
        // Hae käyttäjän user_id
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (userError || !userRow?.id) {
          console.error('User not found for schedule:', userError)
          setSchedule([])
          setScheduleLoading(false)
          return
        }

        // Hae tulevat julkaisut Supabasesta
        const { data: supabaseData, error } = await supabase
          .from('content')
          .select('id, type, idea, status, publish_date, created_at, media_urls, caption')
          .eq('user_id', userRow.id)
          .order('publish_date', { ascending: true, nullsFirst: true })
          .limit(20)

        if (error) {
          console.error('Error fetching schedule:', error)
        }

        // Hae myös Mixpost-postaukset (käytetään axiosia kuten ManagePostsPage)
        let mixpostData = []
        try {
          const session = await supabase.auth.getSession()
          const token = session.data.session?.access_token
          
          if (!token) {
            console.error('No auth token available for Mixpost API')
            mixpostData = []
          } else {
            const response = await axios.get('/api/mixpost-posts', {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            })
            
            const mixpostPosts = response.data
            console.log('Mixpost API returned posts:', mixpostPosts.length, mixpostPosts)
          
          // Käännä statusit suomeksi
          const statusMap = {
            'published': 'Julkaistu',
            'scheduled': 'Aikataulutettu', 
            'draft': 'Luonnos',
            'failed': 'Epäonnistui'
          }
          
          // Muunna kaikki Mixpost-postaukset samaan muotoon kuin Supabase-data
          // HUOM: API palauttaa publishDate (camelCase), muunnetaan publish_date:ksi
          mixpostData = mixpostPosts
            .filter(post => post.publishDate) // Vain postaukset joilla on julkaisupäivä
            .map(post => ({
              id: post.id,
              type: 'Mixpost',
              idea: post.title || post.caption?.slice(0, 80) || 'Postaus',
              status: statusMap[post.status] || post.status,
              publish_date: post.publishDate, // API:sta tuleva publishDate -> publish_date
              publishDate: post.publishDate, // Säilytetään myös alkuperäinen
              created_at: post.createdAt,
              media_urls: post.thumbnail ? [post.thumbnail] : [],
              caption: post.caption,
              source: 'mixpost',
              accounts: post.accounts || [],
              channelNames: post.channelNames || []
            }))
          
            console.log('Mixpost posts with publishDate:', mixpostData.length, 'out of', mixpostPosts.length)
          }
        } catch (mixpostError) {
          console.error('Error fetching Mixpost posts:', mixpostError)
        }

        // Yhdistä Supabase ja Mixpost data
        const allSchedule = [...(supabaseData || []), ...mixpostData]
        console.log('Supabase posts:', supabaseData?.length || 0, 'Mixpost posts:', mixpostData.length, 'Total:', allSchedule.length)
        console.log('First mixpost post:', mixpostData[0])
        setSchedule(allSchedule)
      } catch (e) {
        console.error('Error in fetchSchedule:', e)
        setSchedule([])
      } finally {
        setScheduleLoading(false)
      }
    }
    fetchSchedule()
  }, [user])




  // Tarkista Avatar-materiaalien status
  useEffect(() => {
    const checkAvatarStatus = async () => {
      try {
        const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
        const companyId = userRaw?.companyId || userRaw?.user?.companyId
        
        if (!companyId) {
          return
        }

        const response = await fetch('/api/avatar-status.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            companyId: companyId,
            action: 'checkStatus'
          })
        })

        if (response.ok) {
          const data = await response.json()

          /*
            Webhook palauttaa taulukon objekteja. Merkkaamme materiaalit ladatuiksi näin:
            • imagesUploaded  = löytyy vähintään yksi objekti, jossa on "Avatar IDs"-kenttä tai Media-taulukossa on vähintään yksi kuva.
            • audioUploaded   = löytyy vähintään yksi objekti, jossa on "Voice ID"-kenttä (truthy).
          */
          const hasImages = Array.isArray(data) && data.some(rec => {
            const avatarIds = rec["Avatar IDs"] || rec["Avatar IDs (from something)"]
            const mediaArr  = Array.isArray(rec.Media) ? rec.Media : []
            return (avatarIds && avatarIds.toString().trim() !== '') || mediaArr.length > 0
          })
          const hasAudio = Array.isArray(data) && data.some(rec => {
            const voiceId = rec["Voice ID"]
            return voiceId && voiceId.toString().trim() !== ''
          })

          setImagesUploaded(hasImages)
          setAudioUploaded(hasAudio)
        } else {
          console.error('Avatar status response not ok:', await response.text())
        }
      } catch (error) {
        console.error('Virhe tarkistettaessa Avatar-statusta:', error)
      }
    }
    
    checkAvatarStatus()
  }, [])

  const handleSavePost = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost["Record ID"] || post["Record ID"] === updatedPost["Record ID"]
          ? { ...post, ...updatedPost }
          : post
      )
    )
    setEditingPost(null)
  }

  // Image drag & drop handlers
  const handleImagesDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveImages(true)
  }
  const handleImagesDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveImages(false)
  }
  const handleImagesDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveImages(false)
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      const newImages = files.slice(0, 4 - selectedImages.length) // Max 4 kuvaa yhteensä
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 4))
    }
  }
  const handleImagesInput = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('image/'))
    if (files.length > 0) {
      const newImages = files.slice(0, 4 - selectedImages.length)
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 4))
    }
  }
  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Audio drag & drop handlers
  const handleAudioDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAudio(true)
  }
  const handleAudioDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAudio(false)
  }
  const handleAudioDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActiveAudio(false)
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('audio/'))
    if (files.length > 0) {
      setSelectedAudio(files[0])
    }
  }
  const handleAudioInput = (e) => {
    const files = Array.from(e.target.files).filter(file => file.type.startsWith('audio/'))
    if (files.length > 0) {
      setSelectedAudio(files[0])
    }
  }
  const handleRemoveAudio = () => {
    setSelectedAudio(null)
  }

  // Upload functions
  const handleUploadImages = async () => {
    if (selectedImages.length === 0) return
    setUploadingAvatar(true)
    setAvatarError('')

    try {
      // Hae companyId localStoragesta
      const userRaw = localStorage.getItem('user')
      const companyId = userRaw ? JSON.parse(userRaw)?.companyId || JSON.parse(userRaw)?.user?.companyId : null
      
      const uploads = await Promise.all(selectedImages.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        if (companyId) {
          formData.append('companyId', companyId)
        }
        
        const res = await fetch('/api/avatar-upload.js', {
          method: 'POST',
          body: formData,
        })
        if (!res.ok) throw new Error('upload failed')
        return res.json()
      }))

      setImagesUploaded(true)
    } catch (err) {
      console.error(err)
      setAvatarError('Virhe kuvien lähettämisessä')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleUploadAudio = async () => {
    if (!selectedAudio) return
    setUploadingAvatar(true)
    setAvatarError('')

    try {
      // Hae companyId localStoragesta
      const userRaw = localStorage.getItem('user')
      const companyId = userRaw ? JSON.parse(userRaw)?.companyId || JSON.parse(userRaw)?.user?.companyId : null
      
      const formData = new FormData()
      formData.append('file', selectedAudio)
      if (companyId) {
        formData.append('companyId', companyId)
      }
      
      const res = await fetch('/api/avatar-upload.js', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('upload failed')
      const data = await res.json()
      setAudioUploaded(true)
    } catch (err) {
      console.error(err)
      setAvatarError('Virhe äänen lähettämisessä')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Kirjaudu ulos -handler
  const handleLogout = async () => {
    console.log('=== DASHBOARD LOGOUT START ===')
    console.log('Calling AuthContext signOut...')
    await signOut()
    console.log('AuthContext signOut completed, clearing storage...')
    localStorage.clear()
    sessionStorage.clear()
    console.log('Storage cleared, reloading page...')
    window.location.reload()
    console.log('=== DASHBOARD LOGOUT END ===')
  }

  // Laske tulevat postaukset (seuraavat 7 päivää)
  const now = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(now.getDate() + 7)
  const upcomingCount = posts.filter(post => {
    const date = post.publish_date ? new Date(post.publish_date) : null
    return date && date > now && date < weekFromNow
  }).length

  // Laske julkaisut kuluvassa kuukaudessa (created_at mukaan)
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const monthlyCount = posts.filter(post => {
    const date = post.created_at ? new Date(post.created_at) : null
    return date && date.getMonth() === thisMonth && date.getFullYear() === thisYear
  }).length

  const statusMap = {
    'Draft': t('dashboard.status.Draft'),
    'In Progress': t('dashboard.status.In Progress'),
    'Under Review': t('dashboard.status.Under Review'),
    'Scheduled': t('dashboard.status.Scheduled'),
    'Done': t('dashboard.status.Done'),
    'Deleted': t('dashboard.status.Deleted'),
    'Odottaa': t('dashboard.status.Odottaa'),
    'Pending': t('dashboard.status.Pending'),
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--'
    const d = new Date(dateStr)
    const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-US'
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const stats = [
    { label: t('dashboard.metrics.stats.upcomingPosts'), value: statsData.upcomingCount, sub: `${t('dashboard.upcoming.headers.status')}: ${t('dashboard.status.Scheduled')}` , color: '#22c55e' },
    { label: t('dashboard.metrics.stats.monthlyPosts'), value: `${statsData.monthlyCount} / 30`, sub: t('dashboard.monthly.headers.thisMonth'), color: '#2563eb' },
    { label: t('dashboard.metrics.stats.totalCallPrice'), value: statsData.totalCallPrice.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }), sub: t('dashboard.monthly.headers.thisMonth'), color: '#f59e42' },
    { label: t('dashboard.metrics.stats.totalMessagePrice'), value: statsData.totalMessagePrice.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }), sub: t('dashboard.monthly.headers.thisMonth'), color: '#059669' },
  ]

  // Aikataulu-kortin data: näytetään vain tulevat julkaisut (publish_date >= nyt)
  const nowDate = new Date()
  console.log('=== UPCOMING POSTS FILTER DEBUG ===')
  console.log('Total schedule items:', schedule.length)
  console.log('Sample schedule items:', schedule.slice(0, 3))
  console.log('Now (local):', nowDate)
  console.log('Now (ISO):', nowDate.toISOString())
  
  // Tulevat julkaisut -kortin data: media_urls ja caption mukaan
  const upcomingPosts = (schedule || []).filter(row => {
    if (!row.publish_date) {
      return false
    }
    // Tarkista onko jo UTC-muodossa (sisältää Z tai +)
    const dateStr = row.publish_date
    let publishDate
    if (dateStr.includes('Z') || dateStr.includes('+')) {
      publishDate = new Date(dateStr)
    } else {
      // Lisää Z jotta tulkitaan UTC:nä
      publishDate = new Date(dateStr.replace(' ', 'T') + 'Z')
    }
    const isFuture = publishDate >= nowDate
    if (!isFuture) {
      console.log('FILTERED OUT (past):', row.id, 'publishDate:', publishDate.toISOString(), 'vs now:', nowDate.toISOString())
    }
    return isFuture
  }).sort((a, b) => {
    const dateA = a.publish_date.includes('Z') || a.publish_date.includes('+') 
      ? new Date(a.publish_date) 
      : new Date(a.publish_date.replace(' ', 'T') + 'Z')
    const dateB = b.publish_date.includes('Z') || b.publish_date.includes('+')
      ? new Date(b.publish_date)
      : new Date(b.publish_date.replace(' ', 'T') + 'Z')
    return dateA - dateB
  })
  
  console.log('Schedule:', schedule.length, 'Upcoming posts:', upcomingPosts.length, 'Now:', nowDate)

  function renderMediaCell(row) {
    const urls = row.media_urls || []
    const url = Array.isArray(urls) ? urls[0] : (typeof urls === 'string' ? urls : null)
    if (url) {
      return (
        <img
          src={url}
          alt="media"
          style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, background: '#eee', cursor: 'pointer' }}
          onClick={() => setImageModalUrl(url)}
        />
      )
    }
    return <div style={{ width: 48, height: 48, borderRadius: 8, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 24 }}>–</div>
  }

  function formatUpcomingDate(dateStr) {
    if (!dateStr) return '--'
    // Tarkista onko jo UTC-muodossa (sisältää Z tai +)
    let d
    if (dateStr.includes('Z') || dateStr.includes('+')) {
      d = new Date(dateStr)
    } else {
      // Lisää Z jotta tulkitaan UTC:nä
      d = new Date(dateStr.replace(' ', 'T') + 'Z')
    }
    
    // Muunna Europe/Helsinki aikavyöhykkeeseen vertailua varten
    const helsinkiDate = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }))
    const now = new Date()
    
    // Hae kellonaika
    const timeStr = d.toLocaleString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Helsinki'
    })
    
    if (
      helsinkiDate.getDate() === now.getDate() &&
      helsinkiDate.getMonth() === now.getMonth() &&
      helsinkiDate.getFullYear() === now.getFullYear()
    ) {
      return `${t('dashboard.upcoming.today')} klo ${timeStr}`
    }
    const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-US'
    return d.toLocaleString(locale, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Helsinki'
    })
  }

  return (
    <>
      <PageMeta 
        title={t('dashboard.meta.title')}
        description={t('dashboard.meta.description')}
        image="/hero.png"
      />
      <div className={styles['dashboard-container']}>
        <div className={styles['dashboard-header']}>
          <h1>{t('dashboard.header.title')}</h1>
          <p>{t('dashboard.header.subtitle')}</p>
        </div>
        {/* Metrics Section - VAPIn tyylillä */}
        <div className={styles['metrics-section']}>
          <div className={styles['metrics-header']}>
            <h2>{t('dashboard.metrics.title')}</h2>
            <div className={styles['metrics-filters']}>
              <button 
                className={styles['filter-btn'] + ' ' + (selectedFilter === 'all' ? styles['filter-active'] : '')}
                onClick={() => setSelectedFilter('all')}
              >
                {t('dashboard.metrics.filters.all')}
              </button>
              <button 
                className={styles['filter-btn'] + ' ' + (selectedFilter === 'week' ? styles['filter-active'] : '')}
                onClick={() => setSelectedFilter('week')}
              >
                {t('dashboard.metrics.filters.week')}
              </button>
              <button 
                className={styles['filter-btn'] + ' ' + (selectedFilter === 'month' ? styles['filter-active'] : '')}
                onClick={() => setSelectedFilter('month')}
              >
                {t('dashboard.metrics.filters.month')}
              </button>
            </div>
          </div>
          
          <div className={styles['metrics-grid']}>
            {statsLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className={styles['metric-card']}>
                  <div className={styles['metric-skeleton']}>
                    <div style={{ background: '#eee', height: 16, width: 100, borderRadius: 4 }}></div>
                    <div style={{ background: '#eee', height: 32, width: 80, borderRadius: 6, margin: '12px 0' }}></div>
                    <div style={{ background: '#eee', height: 14, width: 60, borderRadius: 4 }}></div>
                  </div>
                </div>
              ))
            ) : (
              [...dashboardStats,
                { label: t('dashboard.metrics.stats.successCalls'), value: successStats.success || 0, trend: successStats.successRate || 0, color: '#22c55e' },
                { label: t('dashboard.metrics.stats.answerRate'), value: `${successStats.answerRate || 0}%`, trend: successStats.answerRate || 0, color: '#2563eb' }
              ].map((stat, i) => (
                <div key={i} className={styles['metric-card']}>
                  <div className={styles['metric-label']}>{stat.label}</div>
                  <div className={styles['metric-value']}>{stat.value}</div>
                  <div className={styles['metric-trend']}>
                    <span className={styles['trend-icon'] + ' ' + (stat.trend > 0 ? styles['trend-up'] : styles['trend-down'])}>
                      {stat.trend > 0 ? '↗' : '↘'}
                    </span>
                    <span className={styles['trend-text']}>
                      {Math.abs(stat.trend)}% {stat.trend > 0 ? t('dashboard.metrics.stats.trendUpSuffix') : t('dashboard.metrics.stats.trendDownSuffix')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles['dashboard-bentogrid']}>
          
          {/* Poistetaan Engagement Analytics -kortti kokonaan */}
          {/*
          <div className={styles.card} style={{ gridColumn: 'span 2', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>Engagement Analytics</div>
            <div style={{ width: '100%', height: 120, background: 'linear-gradient(90deg,#22c55e22,#2563eb22)', borderRadius: 12, display: 'flex', alignItems: 'flex-end', gap: 8, padding: 16 }}>
              {[40, 60, 80, 50, 90, 70, 100, 60, 80, 50, 70, 90].map((v, i) => (
                <div key={i} style={{ flex: 1, height: v, background: '#22c55e', borderRadius: 6, minWidth: 8 }}></div>
              ))}
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>Dummy chart – korvaa oikealla myöhemmin</div>
          </div>
          */}
          {/* Tulevat julkaisut -kortti: mobiiliystävällinen */}
          <div className={styles.card} style={{ gridColumn: 'span 3', minHeight: 180, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 'clamp(16px, 4vw, 18px)', color: '#1f2937', marginBottom: 12 }}>{t('dashboard.upcoming.title')}</div>
            <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(13px, 3vw, 15px)', minWidth: 600 }}>
                <thead>
                  <tr style={{ color: '#1f2937', fontWeight: 600, background: '#f7f8fc' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', whiteSpace: 'nowrap' }}>{t('dashboard.upcoming.headers.media')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px' }}>{t('dashboard.upcoming.headers.caption')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', whiteSpace: 'nowrap' }}>Kanavat</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', whiteSpace: 'nowrap' }}>{t('dashboard.upcoming.headers.status')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', whiteSpace: 'nowrap' }}>{t('dashboard.upcoming.headers.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5} style={{ background: '#eee', height: 48, borderRadius: 6 }}></td>
                      </tr>
                    ))
                  ) : upcomingPosts.length === 0 ? (
                    <tr><td colSpan={5} style={{ color: '#888', padding: 16, textAlign: 'center' }}>{t('dashboard.upcoming.empty')}</td></tr>
                  ) : (
                    upcomingPosts.map((row, i) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top' }}>{renderMediaCell(row)}</td>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top', wordBreak: 'break-word', maxWidth: '300px' }}>
                          <div style={{ 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical',
                            lineHeight: '1.4em',
                            maxHeight: '2.8em'
                          }}>
                            {row.caption || '--'}
                          </div>
                        </td>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                          {(() => {
                            // Hae kanavat accounts-datasta ja matcha Supabase-dataan
                            if (row.accounts && row.accounts.length > 0) {
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {row.accounts.map((acc, idx) => {
                                    // Hae nimi Supabasesta mixpost_account_uuid:n perusteella
                                    const accountId = acc.id || acc.account_id
                                    const supabaseAccount = socialAccounts.find(sa => 
                                      sa.mixpost_account_uuid === String(accountId)
                                    )
                                    
                                    const name = supabaseAccount?.username 
                                      ? `@${supabaseAccount.username}` 
                                      : supabaseAccount?.account_name 
                                      || acc.name 
                                      || (acc.username ? `@${acc.username}` : null) 
                                      || (acc.provider ? acc.provider.charAt(0).toUpperCase() + acc.provider.slice(1) : null)
                                    
                                    return name ? (
                                      <span key={idx} style={{ 
                                        fontSize: '12px', 
                                        padding: '2px 6px', 
                                        background: '#f3f4f6', 
                                        borderRadius: '4px',
                                        color: '#6b7280'
                                      }}>
                                        {name}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              )
                            }
                            
                            return '--'
                          })()}
                        </td>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{statusMap[row.status] || row.status || '--'}</td>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{formatUpcomingDate(row.publish_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kampanjat – onnistumiset */}
          <div className={styles.card} style={{ gridColumn: 'span 3', minHeight: 180, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 'clamp(16px, 4vw, 18px)', color: '#1f2937', marginBottom: 12 }}>{t('dashboard.campaigns.title')}</div>
            <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'clamp(13px, 3vw, 15px)', minWidth: 520 }}>
                <thead>
                  <tr style={{ color: '#1f2937', fontWeight: 600, background: '#f7f8fc' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', whiteSpace: 'nowrap' }}>{t('dashboard.campaigns.headers.campaign')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', whiteSpace: 'nowrap' }}>{t('dashboard.campaigns.headers.calls')}</th>
                    <th style={{ textAlign: 'left', padding: '8px 4px', whiteSpace: 'nowrap' }}>{t('dashboard.campaigns.headers.successRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignMetrics.length === 0 ? (
                    <tr><td colSpan={3} style={{ color: '#888', padding: 16, textAlign: 'center' }}>{t('dashboard.campaigns.noCampaigns')}</td></tr>
                  ) : (
                    campaignMetrics.slice(0, 6).map(row => (
                      <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top' }}>{row.name}</td>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top' }}>{row.total}</td>
                        <td style={{ padding: '8px 4px', verticalAlign: 'top' }}>{row.successRate}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Split-row: 3/5 (scatter) + 2/5 (heatmap) */}
        <div style={{ gridColumn: '1 / -1', paddingTop: 16, paddingBottom: 8 }}>
          <div className={styles['split-row']}>
            <div className={styles.card} style={{ minHeight: 220, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 'clamp(16px, 4vw, 18px)', color: '#1f2937', marginBottom: 12 }}>{t('dashboard.charts.scatter')}</div>
              <div style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="avgDurationSec" name={t('dashboard.charts.axis.duration')} unit="s" stroke="#6b7280" fontSize={12} />
                    <YAxis dataKey="successRate" name={t('dashboard.charts.axis.successRate')} unit="%" stroke="#6b7280" fontSize={12} />
                    <ZAxis dataKey="count" range={[40, 200]} name={t('dashboard.charts.axis.count')} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [value, name]} />
                    <Legend />
                    <Scatter name="Bin" data={scatterData} fill="#2563eb" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className={styles.card} style={{ minHeight: 260, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 'clamp(16px, 4vw, 18px)', color: '#1f2937', marginBottom: 12 }}>{t('dashboard.charts.heatmap')}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: 720, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: '#1f2937', fontWeight: 600, background: '#f7f8fc' }}>
                      <th style={{ padding: 6, textAlign: 'left' }}>{t('dashboard.charts.day')}</th>
                      {Array.from({ length: 24 }).map((_, h) => (
                        <th key={h} style={{ padding: 4, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 7 }).map((_, d) => {
                      const dayLabels = i18n.language === 'fi' ? ['Ma','Ti','Ke','To','Pe','La','Su'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
                      const dayLabel = dayLabels[d]
                      return (
                        <tr key={d}>
                          <td style={{ padding: 6, fontWeight: 600, color: '#374151' }}>{dayLabel}</td>
                          {Array.from({ length: 24 }).map((_, h) => {
                            const cell = heatmapData.find(x => x.day === d && x.hour === h) || { total: 0, success: 0 }
                            const rate = cell.total > 0 ? Math.round((cell.success / cell.total) * 100) : 0
                            const alpha = rate === 0 ? 0.05 : Math.min(0.85, 0.15 + rate / 100)
                            const bg = `rgba(34,197,94,${alpha})`
                            return (
                              <td key={h} title={`${rate}% (${cell.success}/${cell.total})`} style={{ width: 24, height: 18, background: bg, border: '1px solid #fff' }} />
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        {/* Grafiikki Section - VAPIn tyylillä */}
        <div className={styles['chart-section']}>
          <div className={styles['chart-header']}>
            <h2>{t('dashboard.charts.title')}</h2>
            <div className={styles['chart-filters']}>
              <button 
                className={styles['filter-btn'] + ' ' + (selectedTimeFilter === '7days' ? styles['filter-active'] : '')}
                onClick={() => setSelectedTimeFilter('7days')}
              >
                {t('dashboard.metrics.filters.days7')}
              </button>
              <button 
                className={styles['filter-btn'] + ' ' + (selectedTimeFilter === '30days' ? styles['filter-active'] : '')}
                onClick={() => setSelectedTimeFilter('30days')}
              >
                {t('dashboard.metrics.filters.days30')}
              </button>
            </div>
          </div>
          
          <div className={styles['chart-container']}>
            {chartLoading ? (
              <div className={styles['chart-skeleton']}>
                <div style={{ background: '#eee', height: 200, width: '100%', borderRadius: 8 }}></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#cea78d" 
                    strokeWidth={3}
                    dot={{ fill: '#cea78d', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="#4b3120" 
                    strokeWidth={3}
                    dot={{ fill: '#4b3120', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {imageModalUrl && createPortal(
        <div 
          className="modal-overlay modal-overlay--dark"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setImageModalUrl(null)
            }
          }}
        >
          <div className="modal-container" style={{ 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            background: 'transparent',
            boxShadow: 'none',
            border: 'none',
            padding: 0
          }}>
            <img 
              src={imageModalUrl} 
              alt="media" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                borderRadius: 16, 
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                objectFit: 'contain'
              }} 
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
} 