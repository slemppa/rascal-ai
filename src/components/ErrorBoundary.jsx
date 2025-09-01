import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Kirjaa virhe konsoliin, jotta se näkyy dev-ympäristössä
    console.error('ErrorBoundary caught an error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Jokin meni pieleen</h1>
          <p style={{ color: '#6b7280' }}>Yritä päivittää sivu. Jos virhe toistuu, ota ruutukaappaus konsolista.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f9fafb', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}>
            {String(this.state.error?.message || this.state.error || 'Unknown error')}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}


