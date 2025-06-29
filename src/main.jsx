import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'
import { messages as fiMessages } from './locales/fi/messages.mjs'
import { messages as enMessages } from './locales/en/messages.mjs'

const defaultLocale = 'fi'

async function dynamicActivate(locale) {
  let messages
  if (locale === 'fi') messages = fiMessages
  else if (locale === 'en') messages = enMessages
  else messages = fiMessages
  i18n.load(locale, messages)
  i18n.activate(locale)
}

// Alustetaan oletuskieli
dynamicActivate(defaultLocale)

// Lisätään kuuntelija kielten vaihdolle
i18n.on('activate', (locale) => {
  dynamicActivate(locale)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div>Ladataan...</div>}>
        <I18nProvider i18n={i18n} forceRenderOnLocaleChange={true}>
          <App />
        </I18nProvider>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>
)
