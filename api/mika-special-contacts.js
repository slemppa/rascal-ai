export default async function handler(req, res) {
  console.log('=== Mika Special Contacts API Called ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Body:', req.body)
  
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const n8nUrl = process.env.N8N_MIKA_SPECIAL_CONTACTS || 'https://samikiias.app.n8n.cloud/webhook/mika-special-search'
    const n8nSecret = process.env.N8N_SECRET_KEY
    
    console.log('N8N URL:', n8nUrl)
    console.log('N8N Secret configured:', !!n8nSecret)
    
    // Jos N8N_SECRET_KEY ei ole konfiguroitu, palautetaan testidataa
    if (!n8nSecret) {
      console.log('N8N_SECRET_KEY not configured, returning test data')
      
      if (req.method === 'GET') {
        const testData = [
          {
            id: 1,
            name: 'Matti Meikäläinen',
            email: 'matti.meikalainen@example.com',
            phone: '+358401234567',
            company: 'Testi Oy'
          },
          {
            id: 2,
            name: 'Maija Virtanen',
            email: 'maija.virtanen@example.com',
            phone: '+358501234567',
            company: 'Demo Ltd'
          }
        ]

        return res.status(200).json({
          success: true,
          data: testData,
          timestamp: new Date().toISOString(),
          note: 'Test data - N8N_SECRET_KEY not configured'
        })
      } else if (req.method === 'POST') {
        const testSearchData = [
          {
            id: 3,
            name: 'Testi Hakija',
            email: 'testi.hakija@example.com',
            phone: '+358601234567',
            company: 'Hakija Oy',
            title: 'Toimitusjohtaja'
          }
        ]

        return res.status(200).json({
          success: true,
          data: testSearchData,
          timestamp: new Date().toISOString(),
          note: 'Test search data - N8N_SECRET_KEY not configured'
        })
      }
    }

    // Käsittele GET ja POST kutsut eri tavalla
    if (req.method === 'GET') {
      // GET: Hae kaikki kontaktit
      console.log('GET request: Fetching all contacts from N8N')
      
      const response = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': n8nSecret,
        },
        body: JSON.stringify({
          action: 'get_contacts',
          timestamp: new Date().toISOString()
        })
      })

      console.log('N8N response status:', response.status)
      console.log('N8N response ok:', response.ok)

      if (!response.ok) {
        throw new Error(`N8N request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('N8N response data:', data)

      return res.status(200).json({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        note: 'Data from N8N'
      })
      
    } else if (req.method === 'POST') {
      // POST: Hae kontakteja hakusanoilla
      const { action, name, title, organization } = req.body
      console.log('POST request: Searching contacts in N8N', { action, name, title, organization })
      
      if (action === 'search_contacts') {
        const response = await fetch(n8nUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': n8nSecret,
          },
          body: JSON.stringify({
            action: 'search_contacts',
            name: name || '',
            title: title || '',
            organization: organization || '',
            timestamp: new Date().toISOString()
          })
        })

        console.log('N8N search response status:', response.status)

        if (!response.ok) {
          throw new Error(`N8N search request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log('N8N search response data:', data)

        return res.status(200).json({
          success: true,
          data: data,
          timestamp: new Date().toISOString(),
          note: 'Search results from N8N'
        })
      } else {
        return res.status(400).json({
          error: 'Invalid action',
          details: 'Action must be "search_contacts"'
        })
      }
    }

  } catch (error) {
    console.error('Error in Mika Special Contacts API:', error)
    
    // Jos N8N-kutsu epäonnistuu, palautetaan testidataa
    if (req.method === 'GET') {
      const testData = [
        {
          id: 1,
          name: 'Matti Meikäläinen (Fallback)',
          email: 'matti.meikalainen@example.com',
          phone: '+358401234567',
          company: 'Testi Oy'
        },
        {
          id: 2,
          name: 'Maija Virtanen (Fallback)',
          email: 'maija.virtanen@example.com',
          phone: '+358501234567',
          company: 'Demo Ltd'
        }
      ]

      return res.status(200).json({
        success: true,
        data: testData,
        timestamp: new Date().toISOString(),
        note: 'Fallback data - N8N request failed'
      })
    } else if (req.method === 'POST') {
      const testSearchData = [
        {
          id: 3,
          name: 'Testi Hakija (Fallback)',
          email: 'testi.hakija@example.com',
          phone: '+358601234567',
          company: 'Hakija Oy',
          title: 'Toimitusjohtaja'
        }
      ]

      return res.status(200).json({
        success: true,
        data: testSearchData,
        timestamp: new Date().toISOString(),
        note: 'Fallback search data - N8N request failed'
      })
    }
  }
} 