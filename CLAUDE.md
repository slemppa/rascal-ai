# CLAUDE.md - AI Assistant Guide for Rascal AI

> **Last Updated:** 2026-01-08
> **Version:** 1.110.7
> **Purpose:** Comprehensive guide for AI assistants working with the Rascal AI codebase

---

## 📖 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture & Structure](#architecture--structure)
4. [Development Workflows](#development-workflows)
5. [Key Conventions](#key-conventions)
6. [Security Patterns](#security-patterns)
7. [API Development](#api-development)
8. [Frontend Development](#frontend-development)
9. [Internationalization (i18n)](#internationalization-i18n)
10. [Feature Flags & Permissions](#feature-flags--permissions)
11. [Common Patterns](#common-patterns)
12. [Git & Deployment](#git--deployment)
13. [Testing & Quality](#testing--quality)
14. [Common Tasks](#common-tasks)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Rascal AI** is a professional AI-powered marketing and sales platform that combines:
- **Campaign Management** - Create and manage marketing campaigns
- **Mass Calling** - Outbound/inbound calls with AI-powered scripts
- **CRM Integration** - Contact search and management
- **Content Strategy** - AI-generated content strategies and posts
- **Real-time Analytics** - Dashboard with Google Analytics integration
- **Social Media Management** - Multi-channel content publishing

### Architecture Pattern
- **Frontend:** React 19 + Vite (SPA with React Router)
- **Backend:** Vercel Serverless Functions (`/api` directory)
- **Database:** Supabase PostgreSQL with Row Level Security (RLS)
- **Authentication:** JWT-based via Supabase Auth
- **Automation:** N8N workflow integration with HMAC signatures
- **Deployment:** Vercel (production), localhost:5173 (development)

### Key Characteristics
- **Language:** Finnish primary, English secondary (bilingual UI)
- **Authentication:** JWT tokens with RLS enforcement
- **API Pattern:** Proxy architecture (frontend → `/api` → external services)
- **State Management:** React Context API with reducers
- **Styling:** CSS Modules + traditional CSS
- **Security:** HMAC webhooks, AES-256-GCM encryption, sanitized logging

---

## Technology Stack

### Frontend Core
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI framework |
| Vite | 6.4.1 | Build tool & dev server |
| React Router | 7.6.2 | Client-side routing |
| i18next | 25.4.2 | Internationalization |
| Lucide React | 0.525.0 | Icon library |

### Backend & Services
| Technology | Purpose |
|------------|---------|
| Supabase | PostgreSQL database + Auth |
| Vercel Functions | Serverless API endpoints |
| N8N | Workflow automation |
| Upstash Redis | Rate limiting |
| Vercel Blob | File storage |

### Development Tools
| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Husky | Git hooks |
| Commitlint | Commit message validation |
| Standard Version | Semantic versioning |

---

## Architecture & Structure

### Directory Structure
```
rascal-ai/
├── api/                          # Backend serverless functions
│   ├── middleware/               # Auth & org middleware
│   │   └── with-organization.js  # JWT validation + RLS
│   ├── lib/                      # Shared utilities
│   │   ├── crypto.js             # AES-256-GCM + HMAC
│   │   ├── logger.js             # Sanitized logging
│   │   ├── n8n-client.js         # HMAC webhook client
│   │   ├── rate-limit.js         # Upstash rate limiting
│   │   ├── cors.js               # CORS management
│   │   └── cache.js              # Caching utilities
│   ├── [feature]/                # Feature-specific endpoints
│   │   └── index.js              # Handler with middleware
│   └── auth/google/              # Google OAuth flow
├── src/
│   ├── pages/                    # Route-level components
│   │   ├── DashboardPage.jsx
│   │   ├── CallPanel.jsx
│   │   ├── ManagePostsPage.jsx
│   │   └── ...
│   ├── components/               # Reusable components
│   │   ├── shared/               # Cross-feature components
│   │   ├── auth/                 # Auth components
│   │   ├── campaigns/            # Campaign components
│   │   ├── segments/             # Segment components
│   │   ├── calls/                # Call components
│   │   ├── settings/             # Settings components
│   │   ├── PostCard/             # Post card (owns folder)
│   │   └── SocialMedia/          # Social media + hooks
│   ├── contexts/                 # React Contexts
│   │   ├── AuthContext.jsx       # User + org state
│   │   ├── PostsContext.jsx      # Posts with reducer
│   │   ├── ToastContext.jsx      # Global notifications
│   │   ├── NotificationContext.jsx
│   │   ├── AutoLogoutContext.jsx
│   │   └── StrategyStatusContext.jsx
│   ├── hooks/                    # Custom hooks
│   │   ├── useFeatures.jsx       # Feature flag checks
│   │   ├── useAuth.jsx           # Auth state
│   │   ├── useToast.jsx          # Toast notifications
│   │   └── ...
│   ├── services/                 # API clients
│   │   ├── api.js                # Axios N8N client
│   │   ├── campaignsApi.js
│   │   ├── segmentsApi.js
│   │   └── mixpostApi.js
│   ├── utils/                    # Helper functions
│   ├── constants/                # App constants
│   │   └── posts.js              # Post status maps
│   ├── lib/                      # Shared libraries
│   ├── i18n/                     # i18next config
│   │   └── index.js
│   ├── locales/                  # Translations
│   │   ├── fi/common.json        # Finnish (primary)
│   │   └── en/common.json        # English
│   ├── styles/                   # Global styles
│   └── assets/                   # Static assets
├── public/                       # Public static files
├── docs/                         # Documentation
│   ├── GOOGLE_ANALYTICS_OAUTH_SETUP.md
│   ├── INTEGRATION_WEBHOOKS.md
│   ├── USER_SECRETS_SETUP.md
│   └── SECURITY.md
├── scripts/                      # Utility scripts
├── .husky/                       # Git hooks
│   ├── commit-msg                # Commitlint check
│   └── pre-commit                # Pre-commit checks
├── App.jsx                       # Root component
├── package.json                  # Dependencies
├── vite.config.js                # Vite configuration
├── vercel.json                   # Vercel deployment config
├── commitlint.config.js          # Commit message rules
└── eslint.config.js              # ESLint rules
```

### Data Flow Pattern

```
User Action
    ↓
React Component
    ↓
Frontend API Call (with JWT)
    ↓
/api/[endpoint] (Vercel Function)
    ↓
withOrganization Middleware
    ├── Validates JWT
    ├── Creates Supabase client with user token
    ├── Fetches organization from org_members
    └── Injects: req.supabase, req.authUser, req.organization
    ↓
Handler Function
    ├── Uses req.supabase (RLS-enabled)
    ├── Queries filtered by organization
    └── Returns JSON response
    ↓
Frontend Updates State
    ↓
UI Re-renders
```

---

## Development Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd rascal-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start development server
npm run dev
# Access at http://localhost:5173
```

### Environment Variables

**Frontend Variables** (accessible via `import.meta.env.VITE_*`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_KEY=your-api-key
VITE_N8N_WEBHOOK_URL=https://n8n.example.com/webhook
VITE_MIXPOST_RASCAL_API_URL=https://mixpost.example.com
```

**Backend Variables** (accessible via `process.env.*`):
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
N8N_SECRET_KEY=your-n8n-secret-key
N8N_INTEGRATION_WEBHOOK_URL=https://n8n.example.com/webhook/integration
USER_SECRETS_ENCRYPTION_KEY=your-encryption-key
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://app.rascalai.fi/api/auth/google/callback
```

**⚠️ Security Notes:**
- Frontend vars are **public** (bundled in client code)
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend
- Never expose `N8N_SECRET_KEY` or `USER_SECRETS_ENCRYPTION_KEY` to frontend

### Development Commands

```bash
# Development
npm run dev              # Start Vite dev server (localhost:5173)

# Building
npm run build            # Production build to /dist
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint

# Versioning
npm run release          # Auto-detect version bump
npm run release:patch    # Bump patch version (1.0.0 → 1.0.1)
npm run release:minor    # Bump minor version (1.0.0 → 1.1.0)
npm run release:major    # Bump major version (1.0.0 → 2.0.0)
npm run release:alpha    # Pre-release (1.0.0-alpha.0)
```

---

## Key Conventions

### File Naming

| File Type | Convention | Example |
|-----------|------------|---------|
| React Components | PascalCase.jsx | `DashboardPage.jsx` |
| CSS Files | PascalCase.css | `DashboardPage.css` |
| CSS Modules | PascalCase.module.css | `StatsCard.module.css` |
| API Endpoints | kebab-case.js | `mass-call.js` |
| Utilities | camelCase.js | `formatDate.js` |
| Constants | UPPER_SNAKE_CASE | `POST_STATUS_MAP` |

### Code Style

**React Components:**
```javascript
// Use functional components with hooks
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

function ComponentName() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [state, setState] = useState(initialValue)

  useEffect(() => {
    // Side effects
  }, [dependencies])

  const handleAction = async () => {
    try {
      // Logic
    } catch (error) {
      logger.error('Error message', { error })
    }
  }

  return (
    <div className="component-name">
      <h1>{t('section.title')}</h1>
    </div>
  )
}

export default ComponentName
```

**Variable Declarations:**
```javascript
// Always use const/let, NEVER var
const immutableValue = 'value'
let mutableValue = 0

// Destructure when possible
const { user, loading } = useAuth()
const [state, setState] = useState()
```

**Function Declarations:**
```javascript
// Named functions for components
function ComponentName() {}

// Arrow functions for utilities
const formatDate = (date) => {}

// Async/await for promises
const fetchData = async () => {
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    logger.error('Fetch error', { error })
  }
}
```

### Comments & Documentation

```javascript
// ✅ Good: Explain WHY, not WHAT
// Normalize phone numbers to E.164 format for Twilio API
const normalizedPhone = normalizePhoneNumber(phone)

// ❌ Bad: Redundant comment
// Set phone to normalized phone
const normalizedPhone = normalizePhoneNumber(phone)

// ✅ Good: Document complex logic
// RLS policies require auth.uid() to match org_members.auth_user_id
// so we must use the user's token, not service role
const { data } = await req.supabase.from('campaigns').select('*')

// ✅ Good: TODOs with context
// TODO: Migrate from x-api-key to HMAC (see HMAC_MIGRATION_STATUS.md)
```

**Language for Comments:**
- Use **English** for code comments (international standard)
- Use **Finnish** for user-facing strings (via i18n)
- Exception: Legacy comments may be in Finnish

---

## Security Patterns

### Authentication Flow

```
1. User Login
   ↓
2. Supabase Auth (email/password)
   ↓
3. JWT Token Generated
   ↓
4. Token Stored in Client (Supabase client auto-manages)
   ↓
5. Frontend Requests Include: Authorization: Bearer <JWT>
   ↓
6. Backend Middleware Validates Token
   ↓
7. Creates RLS-Enabled Supabase Client
   ↓
8. Queries Filtered by User's Organization
```

### Row Level Security (RLS)

**How It Works:**
- Supabase RLS policies check `auth.uid()`
- Middleware creates Supabase client with **user's JWT token**
- Queries automatically filtered by user's permissions
- **Never** use service role key for user-initiated requests

**Example:**
```javascript
// ✅ Good: RLS-enabled (uses user token)
const { data } = await req.supabase
  .from('campaigns')
  .select('*')
  .eq('user_id', req.organization.id)

// ❌ Bad: Bypasses RLS (exposes all data)
const serviceClient = createClient(url, SERVICE_ROLE_KEY)
const { data } = await serviceClient.from('campaigns').select('*')
```

### Encryption System

**User Secrets Encryption** (`/api/lib/crypto.js`):

```javascript
// AES-256-GCM with PBKDF2 key derivation
// Format: SALT:IV:AUTH_TAG:ENCRYPTED_DATA (hex-encoded)

import { encrypt, decrypt } from '../lib/crypto.js'

// Encrypt sensitive data
const encrypted = encrypt(plaintext, USER_SECRETS_ENCRYPTION_KEY)

// Decrypt when needed
const decrypted = decrypt(encrypted, USER_SECRETS_ENCRYPTION_KEY)

// Storage in Supabase
await supabase.from('user_secrets').insert({
  user_id: userId,
  service: 'google_analytics',
  secret_value: encrypted,  // Node.js AES-256-GCM
  created_at: new Date()
})
```

**Backward Compatibility:**
- Old format: 3-part (SHA-256)
- New format: 4-part (AES-256-GCM with auth tag)
- Both formats supported for decryption

### HMAC Webhook Validation

**Sending HMAC-Authenticated Requests:**

```javascript
import { sendToN8N } from '../lib/n8n-client.js'

// Automatically adds HMAC signature
await sendToN8N(N8N_WEBHOOK_URL, {
  // Your payload
  userId: user.id,
  data: someData
})

// Headers added automatically:
// x-rascal-timestamp: <unix_timestamp>
// x-rascal-signature: <hmac_sha256_hex>
```

**Migration Status:**
- ✅ 19 endpoints use HMAC via `sendToN8N()`
- ⚠️ ~20 endpoints still use legacy `x-api-key`
- See `/HMAC_MIGRATION_STATUS.md` for details

**When Adding New N8N Webhooks:**
```javascript
// ✅ Always use sendToN8N
import { sendToN8N } from '../lib/n8n-client.js'
await sendToN8N(process.env.N8N_WEBHOOK_URL, payload)

// ❌ Don't use x-api-key
headers: { 'x-api-key': process.env.VITE_API_KEY } // Legacy, being phased out
```

### Sensitive Data Sanitization

**Logger Auto-Redacts:**
```javascript
import logger from '../lib/logger.js'

// These keys are automatically redacted:
const sensitiveKeys = [
  'password', 'token', 'api_key', 'secret',
  'authorization', 'apikey', 'access_token'
]

// ✅ Safe logging
logger.info('User authenticated', {
  userId: user.id,
  token: 'abc123'  // Logged as '***REDACTED***'
})

// ❌ Don't use console.log (not sanitized)
console.log('Token:', token) // Exposes secrets in logs
```

### Security Headers

**Vercel Configuration** (`vercel.json`):
```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-XSS-Protection", "value": "1; mode=block" },
      { "key": "Strict-Transport-Security", "value": "max-age=63072000" }
    ]
  }]
}
```

---

## API Development

### Standard API Endpoint Pattern

```javascript
// api/[feature]/index.js
import { withOrganization } from '../middleware/with-organization.js'
import logger from '../lib/logger.js'
import { setCorsHeaders, handlePreflight } from '../lib/cors.js'
import { checkRateLimit } from '../lib/rate-limit.js'

/**
 * Feature description
 *
 * @route GET /api/[feature]
 * @auth Required (JWT via Authorization header)
 * @returns {Object} Response data
 */
async function handler(req, res) {
  // 1. CORS Headers
  setCorsHeaders(res, ['GET', 'POST', 'OPTIONS'])

  // 2. Handle Preflight
  if (handlePreflight(req, res)) return

  // 3. Method Validation
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 4. Rate Limiting (optional)
  const rateLimitResult = await checkRateLimit(
    'api',  // Preset: 'auth', 'ai', 'api'
    req.authUser.id
  )
  if (!rateLimitResult.success) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: rateLimitResult.reset
    })
  }

  try {
    // 5. Access Authenticated Resources
    const orgId = req.organization.id
    const user = req.authUser

    // 6. Database Query (RLS-enabled)
    const { data, error } = await req.supabase
      .from('table_name')
      .select('*')
      .eq('user_id', orgId)

    if (error) {
      logger.error('Database error', { error })
      return res.status(500).json({
        error: 'Failed to fetch data'
      })
    }

    // 7. Success Response
    return res.status(200).json({
      data,
      message: 'Success'
    })

  } catch (error) {
    logger.error('Unexpected error', { error })
    return res.status(500).json({
      error: 'Internal server error'
    })
  }
}

// Export with middleware
export default withOrganization(handler)
```

### Middleware: `withOrganization`

**What It Does:**
1. Extracts JWT from `Authorization: Bearer <token>` header
2. Validates token with Supabase (`auth.getUser()`)
3. Creates RLS-enabled Supabase client with user token
4. Fetches user's organization from `org_members` table
5. Injects into request:
   - `req.supabase` - RLS-enabled Supabase client
   - `req.authUser` - Authenticated user object
   - `req.organization` - User's organization object

**Usage:**
```javascript
import { withOrganization } from '../middleware/with-organization.js'

async function handler(req, res) {
  // Access injected properties
  const userId = req.authUser.id
  const orgId = req.organization.id
  const { data } = await req.supabase.from('table').select('*')

  return res.status(200).json({ data })
}

export default withOrganization(handler)
```

**When NOT to Use:**
- Public endpoints (no auth required)
- Webhook endpoints (N8N callbacks with HMAC)
- Service-to-service endpoints (API key auth)

### Rate Limiting

**Presets** (`/api/lib/rate-limit.js`):
```javascript
const RATE_LIMITS = {
  auth: { requests: 5, window: '15 m' },     // Login attempts
  ai: { requests: 20, window: '1 m' },       // AI API calls
  api: { requests: 100, window: '1 m' }      // General API
}

// Usage
import { checkRateLimit } from '../lib/rate-limit.js'

const result = await checkRateLimit('auth', userId)
if (!result.success) {
  return res.status(429).json({
    error: 'Too many requests',
    retryAfter: result.reset  // Unix timestamp
  })
}
```

### CORS Management

```javascript
import { setCorsHeaders, handlePreflight } from '../lib/cors.js'

// Set CORS headers
setCorsHeaders(res, ['GET', 'POST', 'OPTIONS'])

// Handle preflight
if (handlePreflight(req, res)) return

// Continue with handler logic...
```

**Default CORS Config:**
- Origin: Request origin (mirrored)
- Methods: Specified in `setCorsHeaders()`
- Headers: `Authorization, Content-Type, x-api-key, x-rascal-timestamp, x-rascal-signature`
- Credentials: `true`

### Error Response Format

**Consistent Error Responses:**
```javascript
// 400 - Bad Request
return res.status(400).json({
  error: 'Validation failed',
  details: validationErrors  // Optional
})

// 401 - Unauthorized
return res.status(401).json({
  error: 'Authentication required'
})

// 403 - Forbidden
return res.status(403).json({
  error: 'Insufficient permissions'
})

// 404 - Not Found
return res.status(404).json({
  error: 'Resource not found'
})

// 429 - Rate Limited
return res.status(429).json({
  error: 'Too many requests',
  retryAfter: timestamp
})

// 500 - Internal Server Error
return res.status(500).json({
  error: 'Internal server error',
  // Never expose internal details in production
})
```

### Success Response Format

```javascript
// Single resource
return res.status(200).json({
  data: resource,
  message: 'Success'  // Optional
})

// Collection
return res.status(200).json({
  data: items,
  count: items.length,
  page: 1,  // If paginated
  total: 100  // If paginated
})

// Created resource
return res.status(201).json({
  data: newResource,
  message: 'Created successfully'
})

// No content
return res.status(204).send()
```

---

## Frontend Development

### Component Structure

**Page Component Pattern:**
```javascript
// src/pages/FeaturePage.jsx
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useFeatures } from '../hooks/useFeatures'
import logger from '../lib/logger'
import './FeaturePage.css'

function FeaturePage() {
  const { t } = useTranslation('common')
  const { user, organization } = useAuth()
  const toast = useToast()
  const { has } = useFeatures()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/endpoint', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch')
      }

      const result = await response.json()
      setData(result.data)

    } catch (err) {
      logger.error('Fetch error', { error: err })
      setError(err.message)
      toast.error(t('errors.fetchFailed'))
    } finally {
      setLoading(false)
    }
  }

  // Feature flag check
  if (!has('Feature Name')) {
    return <div>{t('errors.featureNotAvailable')}</div>
  }

  if (loading) return <div>{t('common.loading')}</div>
  if (error) return <div>{t('errors.generic')}</div>

  return (
    <div className="feature-page">
      <h1>{t('feature.title')}</h1>
      {/* Content */}
    </div>
  )
}

export default FeaturePage
```

**Modal Component Pattern:**
```javascript
// src/components/FeatureModal.jsx
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import './ModalComponents.css'

function FeatureModal({ show, onClose, data }) {
  const { t } = useTranslation('common')
  const toast = useToast()
  const [formData, setFormData] = useState({ ...data })

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (show) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [show, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Validation
      if (!formData.name) {
        toast.error(t('errors.nameRequired'))
        return
      }

      // API call
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed')

      toast.success(t('success.saved'))
      onClose()

    } catch (error) {
      toast.error(t('errors.saveFailed'))
    }
  }

  if (!show) return null

  return (
    <div className="modal-overlay modal-overlay--light" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modal.title')}</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            {/* Form fields */}
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('form.namePlaceholder')}
            />
          </form>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            {t('common.cancel')}
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FeatureModal
```

### State Management Patterns

**Local State (useState):**
```javascript
// Simple component state
const [isOpen, setIsOpen] = useState(false)
const [formData, setFormData] = useState({ name: '', email: '' })
```

**Context State:**
```javascript
// src/contexts/FeatureContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const FeatureContext = createContext()

export function FeatureProvider({ children }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    // Fetch logic
  }

  const addItem = (item) => {
    setItems([...items, item])
  }

  const updateItem = (id, updates) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id))
  }

  const value = {
    items,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refresh: fetchItems
  }

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeature() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider')
  }
  return context
}
```

**Reducer Pattern (Complex State):**
```javascript
// src/contexts/PostsContext.jsx (existing example)
import React, { createContext, useReducer, useMemo } from 'react'

const initialState = {
  posts: [],
  loading: false,
  error: null,
  filters: { status: 'all', search: '' }
}

function postsReducer(state, action) {
  switch (action.type) {
    case 'SET_POSTS':
      return { ...state, posts: action.payload, loading: false }

    case 'ADD_POST':
      return { ...state, posts: [...state.posts, action.payload] }

    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id ? action.payload : post
        )
      }

    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload)
      }

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload }
      }

    default:
      return state
  }
}

export function PostsProvider({ children }) {
  const [state, dispatch] = useReducer(postsReducer, initialState)

  // Memoized selectors
  const filteredPosts = useMemo(() => {
    return state.posts.filter(post => {
      // Filter logic
    })
  }, [state.posts, state.filters])

  const value = {
    ...state,
    filteredPosts,
    dispatch
  }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}
```

### Custom Hooks

**Data Fetching Hook:**
```javascript
// src/hooks/useFetch.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

function useFetch(url, options = {}) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
            ...options.headers
          }
        })

        if (!response.ok) throw new Error('Fetch failed')

        const result = await response.json()
        setData(result.data)
      } catch (err) {
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchData()
  }, [url, user])

  return { data, loading, error }
}

export default useFetch
```

### Styling Patterns

**CSS Modules (Preferred for New Components):**
```javascript
// Component.jsx
import styles from './Component.module.css'

function Component() {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.active}`}>
        Content
      </div>
    </div>
  )
}
```

```css
/* Component.module.css */
.container {
  display: grid;
  gap: 1rem;
}

.card {
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.card.active {
  border-color: var(--rascal-orange);
  box-shadow: 0 4px 12px rgba(255, 102, 0, 0.1);
}
```

**Traditional CSS (Legacy Pattern):**
```javascript
// Component.jsx
import './Component.css'

function Component() {
  return (
    <div className="component-name">
      <div className="component-name__card component-name__card--active">
        Content
      </div>
    </div>
  )
}
```

**Responsive Breakpoints:**
```css
/* Mobile First Approach */
.component {
  padding: 1rem;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}

/* Or Desktop First (existing pattern) */
.component {
  padding: 2rem;
}

@media (max-width: 768px) {
  .component {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .component {
    padding: 0.5rem;
  }
}
```

**Brand Colors (CSS Variables):**
```css
:root {
  --rascal-orange: #ff6600;
  --rascal-green: #22c55e;
  --rascal-red: #ef4444;
  --rascal-blue: #3b82f6;
  --rascal-gray: #6b7280;
}

.btn-primary {
  background: var(--rascal-orange);
}
```

---

## Internationalization (i18n)

### Configuration

**i18n Setup** (`/src/i18n/index.js`):
```javascript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import commonFi from '../locales/fi/common.json'
import commonEn from '../locales/en/common.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fi: { common: commonFi },
      en: { common: commonEn }
    },
    lng: 'fi',  // Default language
    fallbackLng: 'fi',
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['cookie', 'navigator', 'htmlTag'],
      caches: ['cookie'],
      cookieName: 'rascal.lang'
    }
  })

export default i18n
```

### Translation File Structure

**Finnish** (`/src/locales/fi/common.json`):
```json
{
  "meta": {
    "title": "Rascal AI - Markkinointialusta",
    "description": "Tekoälyavusteinen markkinointi ja myynti"
  },
  "nav": {
    "home": "Etusivu",
    "dashboard": "Hallintapaneeli",
    "signin": "Kirjaudu"
  },
  "hero": {
    "title": "Mullistava AI-pohjainen markkinointi",
    "subtitle": "Tehosta myyntiä ja markkinointia"
  },
  "errors": {
    "generic": "Jotain meni pieleen",
    "notFound": "Sivua ei löytynyt",
    "unauthorized": "Ei käyttöoikeutta"
  }
}
```

**English** (`/src/locales/en/common.json`):
```json
{
  "meta": {
    "title": "Rascal AI - Marketing Platform",
    "description": "AI-powered marketing and sales"
  },
  "nav": {
    "home": "Home",
    "dashboard": "Dashboard",
    "signin": "Sign In"
  },
  "hero": {
    "title": "Revolutionary AI-Powered Marketing",
    "subtitle": "Boost sales and marketing"
  },
  "errors": {
    "generic": "Something went wrong",
    "notFound": "Page not found",
    "unauthorized": "Unauthorized"
  }
}
```

### Usage in Components

```javascript
import { useTranslation } from 'react-i18next'

function Component() {
  const { t, i18n } = useTranslation('common')

  // Basic translation
  const title = t('hero.title')

  // With interpolation
  const greeting = t('user.greeting', { name: 'John' })
  // Translation: "Tervetuloa, {{name}}!" → "Tervetuloa, John!"

  // Conditional translation
  const count = 5
  const message = t('items.count', { count })
  // Translation uses plural rules

  // Change language
  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang)
  }

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>

      <button onClick={() => switchLanguage('fi')}>Suomi</button>
      <button onClick={() => switchLanguage('en')}>English</button>
    </div>
  )
}
```

### Adding New Translations

**Step-by-Step:**

1. **Add key to Finnish** (`/src/locales/fi/common.json`):
```json
{
  "feature": {
    "newKey": "Uusi toiminto"
  }
}
```

2. **Add same key to English** (`/src/locales/en/common.json`):
```json
{
  "feature": {
    "newKey": "New Feature"
  }
}
```

3. **Use in component:**
```javascript
const text = t('feature.newKey')
```

**Best Practices:**
- ✅ Use descriptive, hierarchical keys: `section.subsection.key`
- ✅ Keep keys consistent between languages
- ✅ Use lowercase with camelCase for multi-word keys
- ✅ Group related translations under same section
- ❌ Don't use spaces in keys
- ❌ Don't nest more than 3 levels deep

---

## Feature Flags & Permissions

### Feature Flags System

**Available Features:**
```javascript
// From /src/constants/posts.js
export const DEFAULT_FEATURES = [
  'Social Media',
  'Phone Calls',
  'Email marketing integration',
  'Marketing assistant'
]

// Stored in: public.users.features (text[] column)
```

**Checking Features:**
```javascript
import { useFeatures } from '../hooks/useFeatures'

function Component() {
  const { features, has } = useFeatures()

  // Check if user has feature
  if (!has('Social Media')) {
    return <div>Feature not available</div>
  }

  // Conditional rendering
  return (
    <div>
      {has('Phone Calls') && <CallButton />}
      {has('Marketing assistant') && <AIChat />}
    </div>
  )
}
```

**In Sidebar Navigation:**
```javascript
// src/components/Sidebar.jsx
const { has } = useFeatures()

{has('Social Media') && (
  <NavLink to="/posts">
    <Icon /> {t('nav.socialMedia')}
  </NavLink>
)}

{has('Phone Calls') && (
  <NavLink to="/calls">
    <Icon /> {t('nav.calls')}
  </NavLink>
)}
```

### Role-Based Access Control

**User Roles:**
```javascript
// Hierarchy: superadmin > admin > moderator > user
const roles = ['user', 'moderator', 'admin', 'superadmin']

// Check in components
import { useAuth } from '../contexts/AuthContext'

function AdminPanel() {
  const { user } = useAuth()

  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return <Navigate to="/dashboard" />
  }

  return <AdminContent />
}
```

**Protected Routes:**
```javascript
// App.jsx
import ProtectedRoute from './components/auth/ProtectedRoute'

<Route element={<ProtectedRoute requiredRole="admin"><Layout /></ProtectedRoute>}>
  <Route path="/admin" element={<AdminPage />} />
  <Route path="/admin/users" element={<UserManagement />} />
</Route>
```

### CRM Integration Toggle

**Backend Check:**
```javascript
// api/crm/index.js
const { data: user } = await req.supabase
  .from('users')
  .select('crm_connected')
  .eq('id', req.authUser.id)
  .single()

if (!user.crm_connected) {
  return res.status(403).json({ error: 'CRM not connected' })
}
```

**Frontend Check:**
```javascript
// src/pages/CRMPage.jsx
import { useAuth } from '../contexts/AuthContext'

function CRMPage() {
  const { user, organization } = useAuth()
  const { has } = useFeatures()

  // Double check: feature flag + crm_connected
  if (!has('CRM') || !organization.crm_connected) {
    return <div>{t('crm.notAvailable')}</div>
  }

  return <CRMContent />
}
```

---

## Common Patterns

### Toast Notifications

```javascript
import { useToast } from '../contexts/ToastContext'

function Component() {
  const toast = useToast()

  const handleAction = async () => {
    try {
      await performAction()
      toast.success('Action completed successfully')
    } catch (error) {
      toast.error('Action failed')
    }
  }

  // Types:
  toast.success('Success message')
  toast.error('Error message')
  toast.warning('Warning message')
  toast.info('Info message')

  return <button onClick={handleAction}>Do Action</button>
}
```

### Loading States

```javascript
function Component() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await fetch('/api/data')
        setData(await result.json())
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  return <div>{/* Render data */}</div>
}
```

### Error Boundaries

```javascript
// src/components/ErrorBoundary.jsx
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Usage in App.jsx
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### Debounce Search

```javascript
import { useState, useEffect } from 'react'

function SearchComponent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch when debounced term changes
  useEffect(() => {
    if (debouncedTerm) {
      fetchResults(debouncedTerm)
    }
  }, [debouncedTerm])

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  )
}
```

### Pagination

```javascript
function PaginatedList({ items, itemsPerPage = 10 }) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  return (
    <div>
      <div className="items-list">
        {currentItems.map(item => (
          <div key={item.id}>{item.name}</div>
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>

        <span>Page {currentPage} of {totalPages}</span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
```

### File Upload

```javascript
import { useState } from 'react'
import { useToast } from '../contexts/ToastContext'

function FileUpload() {
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File too large (max 5MB)')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type')
      return
    }

    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload failed')

      const result = await response.json()
      toast.success('File uploaded successfully')

    } catch (error) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleFileChange}
        disabled={uploading}
        accept="image/jpeg,image/png,image/webp"
      />
      {uploading && <span>Uploading...</span>}
    </div>
  )
}
```

---

## Git & Deployment

### Commit Convention

**Format:** `type(scope): description`

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Test changes
- `build` - Build system changes
- `ci` - CI/CD changes
- `chore` - Maintenance tasks
- `revert` - Revert previous commit

**Examples:**
```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(dashboard): resolve data loading issue"
git commit -m "docs(api): update endpoint documentation"
git commit -m "refactor(components): simplify modal logic"
git commit -m "chore(deps): update React to v19"
```

**Rules:**
- Max 72 characters for header
- No period at end of subject
- Use imperative mood ("add" not "added")
- Optional body for detailed explanation
- Reference issues: `fixes #123` or `closes #456`

### Git Hooks

**Commit Message Validation** (`.husky/commit-msg`):
```bash
#!/bin/sh
npx commitlint --edit "$1"
```

**Pre-commit Checks** (`.husky/pre-commit`):
```bash
#!/bin/sh
# Currently minimal, but can be extended
npm run lint  # Future: Run tests, type checking, etc.
```

### Versioning Workflow

**Semantic Versioning:**
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

**Release Process:**
```bash
# 1. Make changes and commit with conventional commits
git add .
git commit -m "feat: add new feature"

# 2. Run standard-version to bump version and generate changelog
npm run release        # Auto-detect bump type
# OR
npm run release:patch  # 1.0.0 → 1.0.1
npm run release:minor  # 1.0.0 → 1.1.0
npm run release:major  # 1.0.0 → 2.0.0

# 3. Push with tags
git push --follow-tags origin main
```

**What `standard-version` Does:**
1. Analyzes commit messages since last release
2. Determines version bump (feat = minor, fix = patch)
3. Updates `package.json` version
4. Generates/updates `CHANGELOG.md`
5. Creates git tag (e.g., `v1.1.0`)
6. Commits changes with message: `chore(release): 1.1.0`

### Hotfix Process

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix bug and commit
git add .
git commit -m "fix: resolve critical production bug"

# 3. Bump patch version
npm run release:patch

# 4. Merge to main
git checkout main
git merge hotfix/critical-bug
git push --follow-tags

# 5. Deploy automatically via Vercel

# 6. Clean up
git branch -d hotfix/critical-bug
```

### Deployment

**Vercel Automatic Deployment:**
1. Push to `main` branch
2. Vercel automatically detects changes
3. Runs `npm run build`
4. Deploys to production
5. Serverless functions in `/api` deployed automatically

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Environment Variables (Vercel Dashboard):**
- Set all `VITE_*` variables for frontend
- Set all `process.env.*` variables for backend
- Never commit `.env.local` to git

**Preview Deployments:**
- Every PR gets a preview deployment
- Test changes before merging
- Preview URL: `https://rascal-ai-<branch>-<hash>.vercel.app`

---

## Testing & Quality

### ESLint Configuration

**Frontend Rules** (`eslint.config.js`):
- React Hooks rules enforced
- React Refresh component exports
- No unused variables (except uppercase constants)
- Modern ES6+ syntax

**Running Linter:**
```bash
npm run lint          # Check for issues
npm run lint --fix    # Auto-fix issues (if available)
```

### Code Quality Checklist

**Before Committing:**
- [ ] Code follows existing patterns
- [ ] No console.log statements (use logger)
- [ ] All strings translated (use t() function)
- [ ] Components have proper error handling
- [ ] API endpoints have rate limiting (if needed)
- [ ] Security: No exposed secrets
- [ ] Commit message follows convention
- [ ] ESLint passes with no errors

**Before Creating PR:**
- [ ] Features tested locally
- [ ] Mobile responsive (if UI changes)
- [ ] Both languages tested (Finnish + English)
- [ ] No breaking changes (or documented)
- [ ] CHANGELOG will be auto-generated
- [ ] Version bump appropriate

### Manual Testing

**Local Testing:**
```bash
# 1. Start dev server
npm run dev

# 2. Test in browser
# - http://localhost:5173
# - Open DevTools
# - Test on mobile viewport

# 3. Check API endpoints
# - Verify auth works
# - Check network tab for errors
# - Test error states

# 4. Test translations
# - Switch between Finnish and English
# - Verify all strings translated
```

**Production Testing:**
```bash
# Build and preview locally
npm run build
npm run preview

# Access at http://localhost:4173
# Test as close to production as possible
```

---

## Common Tasks

### Adding a New Page

```bash
# 1. Create page component
touch src/pages/NewFeaturePage.jsx
touch src/pages/NewFeaturePage.css

# 2. Implement component (see Frontend Development section)

# 3. Add translations
# Edit src/locales/fi/common.json
# Edit src/locales/en/common.json

# 4. Add route in App.jsx
# <Route path="/new-feature" element={<NewFeaturePage />} />

# 5. Add navigation link in Sidebar.jsx (if needed)

# 6. Commit
git add .
git commit -m "feat(pages): add new feature page"
```

### Adding a New API Endpoint

```bash
# 1. Create endpoint file
mkdir -p api/new-feature
touch api/new-feature/index.js

# 2. Implement handler (see API Development section)

# 3. Test locally
curl http://localhost:5173/api/new-feature \
  -H "Authorization: Bearer <token>"

# 4. Commit
git add .
git commit -m "feat(api): add new feature endpoint"

# 5. Deploy (automatic on push to main)
```

### Adding a New Modal

```bash
# 1. Create modal component
touch src/components/NewFeatureModal.jsx

# 2. Use existing modal CSS
# Import './ModalComponents.css'

# 3. Implement modal (see Frontend Development section)

# 4. Add to parent component
# const [showModal, setShowModal] = useState(false)
# <NewFeatureModal show={showModal} onClose={() => setShowModal(false)} />

# 5. Add translations for modal content

# 6. Commit
git add .
git commit -m "feat(components): add new feature modal"
```

### Adding a New Translation Key

```bash
# 1. Add to Finnish (src/locales/fi/common.json)
{
  "newFeature": {
    "title": "Uusi toiminto",
    "description": "Kuvaus"
  }
}

# 2. Add to English (src/locales/en/common.json)
{
  "newFeature": {
    "title": "New Feature",
    "description": "Description"
  }
}

# 3. Use in component
const { t } = useTranslation('common')
const title = t('newFeature.title')

# 4. Commit
git add .
git commit -m "feat(i18n): add translations for new feature"
```

### Adding a New Feature Flag

```bash
# 1. Add feature to database (Supabase)
# Update public.users.features column (text[])
# Example: ['Social Media', 'Phone Calls', 'New Feature']

# 2. Check feature in component
import { useFeatures } from '../hooks/useFeatures'
const { has } = useFeatures()

if (!has('New Feature')) {
  return <div>Not available</div>
}

# 3. Update default features (optional)
# Edit src/constants/posts.js
export const DEFAULT_FEATURES = [
  'Social Media',
  'Phone Calls',
  'Email marketing integration',
  'Marketing assistant',
  'New Feature'
]

# 4. Add to navigation (if needed)
# Edit src/components/Sidebar.jsx
{has('New Feature') && (
  <NavLink to="/new-feature">New Feature</NavLink>
)}

# 5. Commit
git add .
git commit -m "feat(features): add new feature flag"
```

### Migrating Endpoint to HMAC

```bash
# 1. Replace manual fetch with sendToN8N
# Before:
const response = await fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'x-api-key': process.env.VITE_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
})

# After:
import { sendToN8N } from '../lib/n8n-client.js'
await sendToN8N(N8N_WEBHOOK_URL, payload)

# 2. Update HMAC_MIGRATION_STATUS.md
# Move endpoint from "Unmigrated" to "Migrated" section

# 3. Test endpoint
# Verify HMAC signature is sent correctly

# 4. Commit
git add .
git commit -m "security(api): migrate endpoint to HMAC authentication"
```

### Adding Rate Limiting to Endpoint

```bash
# 1. Import rate limiter
import { checkRateLimit } from '../lib/rate-limit.js'

# 2. Add rate limit check in handler
async function handler(req, res) {
  // ... CORS and preflight ...

  // Rate limiting
  const result = await checkRateLimit('api', req.authUser.id)
  if (!result.success) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.reset
    })
  }

  // ... rest of handler ...
}

# 3. Choose preset or custom limit
# Presets: 'auth' (5/15m), 'ai' (20/1m), 'api' (100/1m)
# See /api/lib/rate-limit.js

# 4. Commit
git add .
git commit -m "feat(api): add rate limiting to endpoint"
```

---

## Troubleshooting

### Common Issues

**Issue: "withOrganization middleware fails"**
```
Error: User not authenticated
Solution:
1. Check Authorization header is set: `Bearer <token>`
2. Verify token is valid (not expired)
3. Check Supabase auth is working
4. Verify user exists in org_members table
```

**Issue: "RLS policy blocks query"**
```
Error: Row level security policy violation
Solution:
1. Ensure using req.supabase (RLS-enabled client)
2. Check RLS policies in Supabase dashboard
3. Verify user's organization ID matches query
4. Check auth.uid() matches expected user
```

**Issue: "CORS error in browser"**
```
Error: Access-Control-Allow-Origin missing
Solution:
1. Add setCorsHeaders(res, ['GET', 'POST']) in handler
2. Add handlePreflight check for OPTIONS method
3. Verify origin is allowed in CORS config
```

**Issue: "Translation key not found"**
```
Error: Translation key "key.name" not found
Solution:
1. Check key exists in both fi/common.json and en/common.json
2. Verify namespace is 'common'
3. Check for typos in key path
4. Restart dev server (locales cached)
```

**Issue: "Feature flag not working"**
```
Error: Feature appears available but shouldn't be
Solution:
1. Check user.features in AuthContext
2. Verify database column: public.users.features
3. Check useFeatures hook implementation
4. Clear browser cache / local storage
```

**Issue: "Modal won't close on Escape"**
```
Error: Escape key doesn't close modal
Solution:
1. Add useEffect with keydown listener
2. Check if event.key === 'Escape'
3. Verify show prop controls visibility
4. Clean up listener in useEffect return
```

**Issue: "API returns 401 Unauthorized"**
```
Error: 401 Unauthorized
Solution:
1. Check JWT token is present in request
2. Verify token hasn't expired
3. Check Supabase service role key in env vars
4. Verify withOrganization middleware is applied
```

**Issue: "Build fails in production"**
```
Error: Build fails but works locally
Solution:
1. Check for unused imports (ESLint error)
2. Verify all env vars set in Vercel dashboard
3. Check for browser-only APIs used in SSR
4. Review build logs in Vercel dashboard
```

**Issue: "Hot reload not working"**
```
Error: Changes don't reflect in browser
Solution:
1. Check vite.config.js HMR settings
2. Verify port 5173 is not blocked
3. Clear browser cache (Ctrl+Shift+R)
4. Restart dev server: npm run dev
5. Check for locale file changes (ignored by HMR)
```

### Debugging Tips

**Frontend Debugging:**
```javascript
// Use logger instead of console.log
import logger from '../lib/logger'
logger.info('Debug info', { data })

// React DevTools
// Install: https://react.dev/learn/react-developer-tools

// Check context values
import { useAuth } from '../contexts/AuthContext'
const auth = useAuth()
console.log('Auth state:', auth)  // Only for debugging
```

**Backend Debugging:**
```javascript
// Use logger for safe logging
import logger from './lib/logger.js'
logger.info('Request received', { method: req.method, url: req.url })
logger.error('Error occurred', { error })

// Check middleware injection
console.log('Organization:', req.organization)
console.log('User:', req.authUser)

// Verify Supabase client
const { data, error } = await req.supabase.from('table').select('*')
logger.info('Query result', { data, error })
```

**Network Debugging:**
```bash
# Check API endpoint locally
curl http://localhost:5173/api/endpoint \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# Check with verbose output
curl -v http://localhost:5173/api/endpoint

# Check CORS headers
curl -I http://localhost:5173/api/endpoint
```

**Database Debugging:**
```sql
-- Check user organization
SELECT * FROM org_members WHERE auth_user_id = '<user_id>';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Check user features
SELECT id, email, features FROM users WHERE id = '<user_id>';
```

---

## Additional Resources

### Documentation Files

- **README.md** - Project overview and setup
- **VERSIONING.md** - Versioning guidelines
- **CHANGELOG.md** - Auto-generated release notes
- **HMAC_MIGRATION_STATUS.md** - HMAC migration progress
- **SECURITY_AUDIT_REPORT.md** - Security audit findings
- **TOAST_USAGE.md** - Toast notification patterns
- **N8N_ENDPOINTS_ANALYSIS.md** - N8N webhook documentation

### External Documentation

- **Supabase Docs:** https://supabase.io/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **i18next Docs:** https://www.i18next.com
- **Vercel Docs:** https://vercel.com/docs

### Internal Documentation

- **docs/GOOGLE_ANALYTICS_OAUTH_SETUP.md** - Google Analytics OAuth setup
- **docs/INTEGRATION_WEBHOOKS.md** - Webhook integrations
- **docs/USER_SECRETS_SETUP.md** - User secrets encryption
- **docs/LEADMAGNET_SETUP.md** - Lead magnet configuration
- **docs/SECURITY.md** - Security guidelines

---

## Summary: Key Principles for AI Assistants

### Always Do ✅

1. **Use existing patterns** - Follow established conventions
2. **Translate everything** - Add to both fi and en locales
3. **Use RLS-enabled clients** - Always use `req.supabase` from middleware
4. **Sanitize logs** - Use `logger` instead of `console.log`
5. **Handle errors gracefully** - Try-catch with toast notifications
6. **Check feature flags** - Respect user permissions
7. **Follow commit convention** - Use conventional commits
8. **Mobile responsive** - Test on multiple screen sizes
9. **Use HMAC for N8N** - Always use `sendToN8N()` helper
10. **Document changes** - Update relevant docs

### Never Do ❌

1. **Don't expose secrets** - Keep service role keys in backend only
2. **Don't bypass RLS** - Never use service role for user requests
3. **Don't skip translations** - All user-facing text must be i18n
4. **Don't use var** - Use const/let only
5. **Don't console.log in production** - Use logger with sanitization
6. **Don't hardcode strings** - Use translation keys
7. **Don't skip validation** - Always validate user input
8. **Don't commit .env files** - Keep secrets out of git
9. **Don't break conventions** - Follow existing patterns
10. **Don't skip error handling** - Every API call needs try-catch

### When in Doubt

- Check existing similar components/endpoints
- Review this CLAUDE.md document
- Look at recent commits for patterns
- Ask for clarification if requirements unclear
- Test thoroughly before committing

---

**End of CLAUDE.md**

*This document is maintained by the development team. Last updated: 2026-01-08*
