import axios from 'axios'

// N8N webhook URL - muuta tämä oikeaksi URL:ksi
const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL_HERE'

// Axios instance konfiguraatiolla
const api = axios.create({
  baseURL: N8N_WEBHOOK_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_API_KEY
  },
})

// Dashboard datan haku
export const fetchDashboardData = async (companyId) => {
  try {
    const url = companyId ? `/api/get-posts?companyId=${companyId}` : '/api/get-posts'
    const response = await axios.get(url)
    return response.data
  } catch (error) {
    console.error('Virhe dashboard datan haussa:', error)
    throw new Error('Tietojen haku epäonnistui')
  }
}

// Tulevien julkaisujen haku
export const fetchUpcomingPosts = async () => {
  try {
    const response = await api.get('/posts/upcoming')
    return response.data
  } catch (error) {
    console.error('Virhe tulevien julkaisujen haussa:', error)
    throw new Error('Julkaisujen haku epäonnistui')
  }
}

// Sähköpostien haku
export const fetchEmails = async () => {
  try {
    const response = await api.get('/emails')
    return response.data
  } catch (error) {
    console.error('Virhe sähköpostien haussa:', error)
    throw new Error('Sähköpostien haku epäonnistui')
  }
}

// Tilaajien haku
export const fetchSubscribers = async () => {
  try {
    const response = await api.get('/subscribers')
    return response.data
  } catch (error) {
    console.error('Virhe tilaajien haussa:', error)
    throw new Error('Tilaajien haku epäonnistui')
  }
}

// Seuraavan sukupolven ajan haku
export const fetchNextGenerationTime = async () => {
  try {
    const response = await api.get('/generation-time')
    return response.data
  } catch (error) {
    console.error('Virhe sukupolven ajan haussa:', error)
    throw new Error('Ajan haku epäonnistui')
  }
}

// Mock data testausta varten
export const getMockDashboardData = () => {
  return {
    upcomingPosts: [
      { 
        id: 1, 
        title: 'Tuleva julkaisu 1', 
        date: '2024-01-15', 
        status: 'draft',
        excerpt: 'Tämä on esikatselu tulevasta julkaisusta...'
      },
      { 
        id: 2, 
        title: 'Tuleva julkaisu 2', 
        date: '2024-01-20', 
        status: 'review',
        excerpt: 'Toinen tuleva julkaisu katselmoinnissa...'
      },
      { 
        id: 3, 
        title: 'Tuleva julkaisu 3', 
        date: '2024-01-25', 
        status: 'draft',
        excerpt: 'Kolmas tuleva julkaisu luonnosvaiheessa...'
      }
    ],
    emails: [
      { 
        id: 1, 
        subject: 'Uutiskirje #1 - Tammikuu 2024', 
        sent: '2024-01-10', 
        opens: 150,
        clicks: 45,
        unsubscribes: 2
      },
      { 
        id: 2, 
        subject: 'Uutiskirje #2 - Viikkokatsaus', 
        sent: '2024-01-12', 
        opens: 200,
        clicks: 67,
        unsubscribes: 1
      },
      { 
        id: 3, 
        subject: 'Uutiskirje #3 - Erityistarjoukset', 
        sent: '2024-01-14', 
        opens: 180,
        clicks: 89,
        unsubscribes: 3
      }
    ],
    subscribers: [
      { 
        id: 1, 
        email: 'user1@example.com', 
        joined: '2024-01-01', 
        status: 'active',
        lastActivity: '2024-01-14'
      },
      { 
        id: 2, 
        email: 'user2@example.com', 
        joined: '2024-01-05', 
        status: 'active',
        lastActivity: '2024-01-13'
      },
      { 
        id: 3, 
        email: 'user3@example.com', 
        joined: '2024-01-08', 
        status: 'inactive',
        lastActivity: '2024-01-10'
      },
      { 
        id: 4, 
        email: 'user4@example.com', 
        joined: '2024-01-12', 
        status: 'active',
        lastActivity: '2024-01-14'
      }
    ],
    nextGenerationTime: '2024-01-25T10:00:00Z',
    stats: {
      totalSubscribers: 1250,
      activeSubscribers: 1180,
      averageOpenRate: 0.75,
      averageClickRate: 0.25
    }
  }
}

export default api 