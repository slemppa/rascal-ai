import React, { useState } from 'react'
import './ChatbotWidget.css'

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'chatbot-widget',
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', phone: '' })
        setTimeout(() => {
          setIsOpen(false)
          setSubmitStatus(null)
        }, 2000)
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Lomakkeen lähetys epäonnistui:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleModal = () => {
    setIsOpen(!isOpen)
    if (isOpen) {
      setSubmitStatus(null)
      setFormData({ name: '', email: '', phone: '' })
    }
  }

  return (
    <div className="chatbot-widget">
      {/* Chatbot-ikkuna */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>Haluatko tietää lisää Rascal AIsta?</h3>
          </div>
          <div className="chatbot-content">
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Nimi</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Etunimi Sukunimi"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Sähköposti</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="nimi@firma.fi"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Puhelinnumero</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+358 40 123 4567"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {submitStatus === 'success' && (
                <div className="success-message">
                  Olemme sinuun nopeammin yhteydessä kun uskotkaan!
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="error-message">
                  Jokin meni pieleen. Yritä uudelleen.
                </div>
                )
              }

              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Lähetetään...' : 'Lähetä'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Chatbot-nappi */}
      <button
        className="chatbot-toggle"
        onClick={toggleModal}
        aria-label={isOpen ? "Sulje chatbot" : "Avaa chatbot"}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span>{isOpen ? "Sulje" : "Kysy lisää"}</span>
      </button>
    </div>
  )
}
