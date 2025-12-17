export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    return res.status(200).json({
      success: true,
      message: 'Test endpoint working',
      method: req.method,
      body: req.body
    })
  } catch (error) {
    console.error('Test error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
