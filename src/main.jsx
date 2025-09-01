import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './i18n/index.js'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)
