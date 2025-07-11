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
      search = '', 
      status = '', 
      callType = '', 
      dateFrom = '', 
      dateTo = '',
      format = 'csv'
    } = req.query
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId parameter is required' })
    }

    console.log('Exporting call logs for company:', companyId, 'format:', format)

    // Lähetä kutsu N8N webhookiin (ilman filttereitä, koska filtteröinti tehdään backendissä)
    const response = await axios.get(N8N_CALL_LOGS_URL, {
      params: { 
        companyId,
        sheetUrl,
        limit: 1000 // Hae kaikki dataa
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': N8N_SECRET_KEY
      }
    })

    // N8N palauttaa dataa items array:ssa tai suoraan
    const n8nData = response.data
    let items = []
    
    if (Array.isArray(n8nData)) {
      items = n8nData[0]?.items || n8nData
    } else if (n8nData.items) {
      items = n8nData.items
    } else {
      items = Array.isArray(n8nData) ? n8nData : []
    }

    console.log('Export - Original items count:', items.length)
    console.log('Export - Search parameters:', { search, status, callType, dateFrom, dateTo })

    // BACKEND-FILTTERÖINTI (sama kuin call-logs.js:ssä)
    let filteredItems = [...items]
    
    // Tekstihaku
    if (search && search.trim()) {
      const searchLower = decodeURIComponent(search.replace(/\+/g, ' ')).toLowerCase().trim()
      console.log('Export - Searching for:', searchLower)
      filteredItems = filteredItems.filter(item => {
        return Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        )
      })
      console.log('Export - After search filter:', filteredItems.length, 'items')
    }
    
    // Status-filtteri
    if (status && status.trim()) {
      filteredItems = filteredItems.filter(item => {
        const itemStatus = item.Answered || item.Onnistunut || item.Status
        if (!itemStatus) return false
        
        const statusLower = status.toLowerCase()
        const itemStatusLower = itemStatus.toString().toLowerCase()
        
        if (statusLower === 'onnistuneet' || statusLower === 'onnistui') {
          return itemStatusLower === 'kyllä' || itemStatusLower === 'kyllä' || itemStatusLower === '1' || itemStatusLower === 'true'
        } else if (statusLower === 'epäonnistuneet' || statusLower === 'epäonnistui') {
          return itemStatusLower === 'ei' || itemStatusLower === 'ei' || itemStatusLower === '0' || itemStatusLower === 'false'
        } else {
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

    console.log('Export filtered items:', filteredItems.length, 'records')

    const exportData = filteredItems
    
    // Jos N8N palauttaa suoraan CSV-dataa
    if (format === 'csv' && typeof exportData === 'string') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="puheluloki_${new Date().toISOString().split('T')[0]}.csv"`)
      return res.status(200).send(exportData)
    }
    
    // Jos N8N palauttaa JSON-dataa, muunna se CSV:ksi
    if (format === 'csv' && Array.isArray(exportData)) {
      console.log('Export - Creating CSV with', exportData.length, 'items')
      console.log('Export - Sample item:', exportData[0])
      
      const csvHeaders = ['Nimi', 'Puhelinnumero', 'Yhteenveto', 'Hinta', 'Puhelun tyyppi', 'Päivämäärä', 'Vastattu', 'Kesto']
      const csvRows = exportData.map(item => [
        item.Nimi || '',
        item.Puhelinnumero || '',
        item.Summary || item.Huomiot || '',
        item.Price || '',
        item['Call Type'] || item.PuhelunTyyppi || item.CallType || '',
        item.Date || '',
        item.Answered || '',
        item.Duration || ''
      ])
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')
      
      console.log('Export - CSV content length:', csvContent.length)
      console.log('Export - CSV preview:', csvContent.substring(0, 200))
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="puheluloki_${new Date().toISOString().split('T')[0]}.csv"`)
      return res.status(200).send(csvContent)
    }

    // Palauta JSON-dataa
    res.status(200).json({ 
      data: exportData,
      message: 'Puheluloki exportattu onnistuneesti'
    })
  } catch (error) {
    console.error('N8N export webhook error:', error.response?.status, error.response?.statusText)
    console.error('Error details:', error.response?.data || error.message)
    
    res.status(error.response?.status || 500).json({ 
      error: `N8N export webhook failed: ${error.response?.status || 500} ${error.response?.statusText || 'Internal Server Error'}`,
      details: error.response?.data || error.message
    })
  }
} 