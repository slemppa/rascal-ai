import cacheManager from '../_lib/cache.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Tyhjennä analytics cache
    const analyticsKeys = cacheManager.keys().filter(key => key.startsWith('analytics_'))
    analyticsKeys.forEach(key => cacheManager.delete(key))
    
    return res.status(200).json({
      success: true,
      message: 'Cache refreshed successfully',
      clearedKeys: analyticsKeys.length
    })

  } catch (error) {
    console.error('Cache refresh error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 