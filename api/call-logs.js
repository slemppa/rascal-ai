import axios from 'axios'

const N8N_CALL_LOGS_URL = process.env.N8N_CALL_LOGS_URL || 'https://samikiias.app.n8n.cloud/webhook/call-logs'
const N8N_SECRET_KEY = process.env.N8N_SECRET_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Tarkista että ympäristömuuttujat on asetettu
  if (!N8N_CALL_LOGS_URL) {
    console.error('Missing N8N_CALL_LOGS_URL environment variable')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  try {
    const { 
      companyId, 
      sheetUrl, 
      page = 1, 
      limit = 25, 
      search = '', 
      status = '', 
      callType = '', 
      dateFrom = '', 
      dateTo = '' 
    } = req.query
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId parameter is required' })
    }

    console.log('Fetching call logs for company:', companyId, 'with filters:', { page, limit, search, status, callType, dateFrom, dateTo })

    // Lähetä kutsu N8N webhookiin kaikilla parametreilla
    const response = await axios.get(N8N_CALL_LOGS_URL, {
      params: { 
        companyId,
        sheetUrl,
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        callType,
        dateFrom,
        dateTo
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })

    // N8N palauttaa dataa items array:ssa tai suoraan
    const n8nData = response.data
    console.log('N8N call logs response structure:', Object.keys(n8nData))
    
    // Etsi items array N8N:n vastauksesta
    let items = []
    let totalCount = 0
    let totalPages = 0
    
    if (Array.isArray(n8nData)) {
      // Jos data on array, etsi items ensimmäisestä elementistä
      items = n8nData[0]?.items || n8nData
    } else if (n8nData.items) {
      // Jos data on objekti ja sisältää items
      items = n8nData.items
    } else {
      // Fallback: kokeile suoraan dataa
      items = Array.isArray(n8nData) ? n8nData : []
    }

    // BACKEND-FILTTERÖINTI
    let filteredItems = [...items]
    
    // Tekstihaku - etsi kaikista kentistä
    if (search && search.trim()) {
      // Korvaa + merkit välilyönneillä ja dekoodaa URL-encoding
      const searchLower = decodeURIComponent(search.replace(/\+/g, ' ')).toLowerCase().trim()
      
      filteredItems = filteredItems.filter(item => {
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        )
      })
    }
    
    // Status-filtteri
    if (status && status.trim()) {
      filteredItems = filteredItems.filter(item => {
        const itemStatus = item.Answered || item.Onnistunut || item.Status
        if (!itemStatus) return false
        
        const statusLower = status.toLowerCase()
        const itemStatusLower = itemStatus.toString().toLowerCase()
        
        // Mappaa suomenkieliset statukset englanninkielisiin
        if (statusLower === 'onnistuneet' || statusLower === 'onnistui') {
          return itemStatusLower === 'kyllä' || itemStatusLower === 'kyllä' || itemStatusLower === '1' || itemStatusLower === 'true'
        } else if (statusLower === 'epäonnistuneet' || statusLower === 'epäonnistui') {
          return itemStatusLower === 'ei' || itemStatusLower === 'ei' || itemStatusLower === '0' || itemStatusLower === 'false'
        } else {
          // Suora vertailu jos ei ole suomenkielinen status
          return itemStatusLower === statusLower
        }
      })
    }
    
    // Puhelun tyyppi -filtteri
    if (callType && callType.trim()) {
      filteredItems = filteredItems.filter(item => {
        const itemCallType = item['Call Type'] || item.PuhelunTyyppi || item.CallType
        return itemCallType && itemCallType.toString().toLowerCase() === callType.toLowerCase()
      })
    }
    
    // Päivämäärärajoitukset
    if (dateFrom && dateFrom.trim()) {
      filteredItems = filteredItems.filter(item => {
        const itemDate = item.Date || item.Päivämäärä
        if (!itemDate) return false
        return itemDate >= dateFrom
      })
    }
    
    if (dateTo && dateTo.trim()) {
      filteredItems = filteredItems.filter(item => {
        const itemDate = item.Date || item.Päivämäärä
        if (!itemDate) return false
        return itemDate <= dateTo
      })
    }

    // Pagination backend-logiikalla
    const totalFilteredCount = filteredItems.length
    const itemsPerPage = parseInt(limit)
    const currentPageNum = parseInt(page)
    const startIndex = (currentPageNum - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    // Hae vain nykyisen sivun rivit
    const paginatedItems = filteredItems.slice(startIndex, endIndex)
    
    totalCount = totalFilteredCount
    totalPages = Math.ceil(totalCount / itemsPerPage)

    console.log('Call logs filtered and paginated:', paginatedItems.length, 'records, total:', totalCount, 'pages:', totalPages)

    // Laske tilastot Google Sheets datasta
    const stats = {
      totalCount: totalCount,
      successfulCount: paginatedItems.filter(item => item.Onnistunut === 'Kyllä' || item.Onnistunut === 'kyllä' || item.Onnistunut === '1').length,
      failedCount: paginatedItems.filter(item => item.Onnistunut === 'Ei' || item.Onnistunut === 'ei' || item.Onnistunut === '0').length,
      averageDuration: 0 // Google Sheets ei sisällä kestoja vielä
    }

    res.status(200).json({ 
      logs: paginatedItems,
      stats: stats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalCount: totalCount,
        limit: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        search,
        status,
        callType,
        dateFrom,
        dateTo
      },
      message: 'Puheluloki haettu onnistuneesti'
    })
  } catch (error) {
    console.error('N8N webhook error:', error.response?.status, error.response?.statusText)
    console.error('Error details:', error.response?.data || error.message)
    
    res.status(error.response?.status || 500).json({ 
      error: `N8N webhook failed: ${error.response?.status || 500} ${error.response?.statusText || 'Internal Server Error'}`,
      details: error.response?.data || error.message
    })
  }
} 