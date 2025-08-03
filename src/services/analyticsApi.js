// src/services/analyticsApi.js
import { supabase } from '../lib/supabase'

class AnalyticsService {
  async getAnalytics() {
    try {
      // Hae session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Kutsu backend API:a
      const response = await fetch('/api/analytics', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Analytics service error:', error)
      throw error
    }
  }

  async refreshCache() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/analytics/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Cache refresh error:', error)
      throw error
    }
  }

  // Mock data fallback jos API ei toimi
  getMockAnalytics() {
    return {
      summary: {
        totalContent: 0,
        publishedContent: 0,
        scheduledContent: 0,
        totalCalls: 0,
        answeredCalls: 0,
        callCosts: 0,
        totalSegments: 0
      },
      content: {
        total: 0,
        byStatus: {},
        byType: {},
        withMixpostId: 0,
        published: 0,
        scheduled: 0
      },
      calls: {
        total: 0,
        answered: 0,
        byStatus: {},
        avgDuration: 0,
        totalCost: 0
      },
      segments: {
        total: 0,
        byStatus: {},
        withMedia: 0
      },
      publishedPosts: {
        total: 0,
        byStatus: {},
        byPlatform: {}
      },
      workspace: {
        connected: false,
        id: 'mock-workspace-uuid',
        name: 'Päätyöskentely-ympäristö',
        lastSync: new Date().toISOString(),
        dataSource: 'Mock Workspace Data'
      },
      lastUpdated: new Date().toISOString()
    }
  }

  generateMockEngagementData() {
    const data = []
    const today = new Date()
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      data.push({
        date: date.toISOString().split('T')[0],
        engagement_rate: Math.random() * 5 + 1, // 1-6%
        reach: Math.floor(Math.random() * 1000) + 500,
        clicks: Math.floor(Math.random() * 100) + 10
      })
    }
    
    return data
  }
}

export default new AnalyticsService()