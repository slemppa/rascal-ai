import React, { useState, useRef } from 'react'
import axios from 'axios'

export default function AIChatPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Hae companyName localStoragesta
  let companyName = 'Yrityksen';
  try {
    const userRaw = JSON.parse(localStorage.getItem('user') || 'null')
    if (userRaw && userRaw.user && userRaw.user.companyName) {
      companyName = userRaw.user.companyName
    } else if (userRaw && userRaw.companyName) {
      companyName = userRaw.companyName
    }
  } catch (e) {}

  // Vieritä alas aina kun viestit päivittyvät
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMessage = { role: 'user', text: input }
    setMessages(msgs => [...msgs, userMessage])
    setInput('')
    setLoading(true)
    try {
      // Hae companyId ja assistantId localStoragesta/user-objektista
      let companyId = null
      let assistantId = null
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        companyId = user.companyId
        assistantId = user.assistantId || null
      } catch (e) {}
      if (!assistantId) {
        try {
          assistantId = localStorage.getItem('assistantId') || null
        } catch (e) {}
      }
      const res = await axios.post('https://samikiias.app.n8n.cloud/webhook/ab7de54b-9f81-4b26-8421-c8de56f8e89e/chat', {
        message: input,
        companyId,
        assistantId,
      })
      // Ota AI:n vastaus oikeasta kentästä
      const aiText = res.data?.reply || res.data?.message || res.data?.output || res.data?.response || res.data?.text || 'AI ei vastannut.'
      setMessages(msgs => [...msgs, { role: 'ai', text: aiText }])
    } catch (err) {
      setMessages(msgs => [...msgs, { role: 'ai', text: 'AI ei vastannut.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', flex: 1, background: '#f7fafc', padding: 0, margin: 0}}>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch', width: '100%', overflow: 'hidden'}}>
        <div style={{width: '100%', height: '100%', background: '#fff', borderRadius: 0, boxShadow: 'none', border: 'none', padding: 32, minHeight: 120, maxHeight: '100%', overflowY: 'auto', flex: 1}}>
          <h2 style={{marginTop: 0}}>{companyName} markkinointiassistentti</h2>
          <div style={{marginBottom: 12, minHeight: 60, maxHeight: '70vh', overflowY: 'auto'}}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                background: msg.role === 'user' ? '#e6f0ff' : '#f5f5f5',
                color: '#222',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 8,
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '90%',
                whiteSpace: 'pre-line',
                fontSize: 16,
              }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{color: '#888', fontStyle: 'italic', marginBottom: 8}}>AI kirjoittaa...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      <form onSubmit={handleSend} style={{width: '100%', margin: '0', display: 'flex', gap: 8, padding: 32, background: '#fff', borderTop: '1px solid #e1e8ed'}}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Kirjoita viesti..."
          style={{flex: 1, fontSize: 17, padding: '12px 16px', borderRadius: 8, border: '1px solid #cfd8dc', outline: 'none'}}
          disabled={loading}
        />
        <button type="submit" style={{fontSize: 17, padding: '12px 24px', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', cursor: 'pointer'}} disabled={loading || !input.trim()}>
          Lähetä
        </button>
      </form>
    </div>
  )
} 