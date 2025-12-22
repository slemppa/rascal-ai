#!/usr/bin/env node

/**
 * Testikutsut social-endpointeille
 * 
 * Käyttö:
 *   node test-social-endpoints.js [token]
 * 
 * Jos token ei anneta, testataan vain endpointit jotka eivät vaadi auth tokenia
 */

import axios from 'axios'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const AUTH_TOKEN = process.argv[2] || null

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(name) {
  log(`\n${'='.repeat(50)}`, 'cyan')
  log(`Testing: ${name}`, 'bright')
  log('='.repeat(50), 'cyan')
}

async function testEndpoint(name, method, url, options = {}) {
  try {
    log(`\n${method} ${url}`, 'blue')
    
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...(options.data && { data: options.data }),
      ...(options.params && { params: options.params }),
      validateStatus: () => true // Älä throw erroria vaan palauta status
    }

    const response = await axios(config)
    
    log(`Status: ${response.status}`, response.status < 400 ? 'green' : 'red')
    
    if (response.data) {
      try {
        log('Response:', 'green')
        console.log(JSON.stringify(response.data, null, 2))
      } catch (e) {
        log(`Response (not JSON): ${response.data}`, 'yellow')
      }
    }
    
    return { success: response.status < 400, status: response.status, data: response.data }
  } catch (error) {
    log(`Error: ${error.message}`, 'red')
    if (error.response) {
      log(`Status: ${error.response.status}`, 'red')
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red')
    }
    return { success: false, error: error.message }
  }
}

async function runTests() {
  log('\n' + '='.repeat(50), 'bright')
  log('Social Endpoints Test Suite', 'bright')
  log('='.repeat(50), 'bright')
  
  if (!AUTH_TOKEN) {
    log('\n⚠️  No AUTH_TOKEN provided. Testing only endpoints that don\'t require auth.', 'yellow')
    log('To test all endpoints, run: node test-social-endpoints.js YOUR_TOKEN', 'yellow')
  } else {
    log(`\n✅ Using AUTH_TOKEN: ${AUTH_TOKEN.substring(0, 20)}...`, 'green')
  }

  const results = []

  // 1. Test /api/social/reels/list (GET, ei vaadi auth tokenia)
  logTest('/api/social/reels/list')
  const result1 = await testEndpoint(
    '/api/social/reels/list',
    'GET',
    '/api/social/reels/list',
    {
      params: { companyId: 'test-company-id' }
    }
  )
  results.push({ name: '/api/social/reels/list', ...result1 })

  // 2. Test /api/social/posts (GET, vaatii auth tokenin)
  logTest('/api/social/posts')
  if (AUTH_TOKEN) {
    const result2 = await testEndpoint(
      '/api/social/posts',
      'GET',
      '/api/social/posts',
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` }
      }
    )
    results.push({ name: '/api/social/posts', ...result2 })
  } else {
    log('SKIP: AUTH_TOKEN required', 'yellow')
    results.push({ name: '/api/social/posts', skipped: true })
  }

  // 3. Test /api/social/posts/update (POST, ei vaadi auth tokenia)
  logTest('/api/social/posts/update')
  const result3 = await testEndpoint(
    '/api/social/posts/update',
    'POST',
    '/api/social/posts/update',
    {
      data: {
        post_id: 'test-post-id',
        status: 'published',
        updated_at: new Date().toISOString()
      }
    }
  )
  results.push({ name: '/api/social/posts/update', ...result3 })

  // 4. Test /api/social/posts/actions (POST, vaatii auth tokenin)
  logTest('/api/social/posts/actions')
  if (AUTH_TOKEN) {
    const result4 = await testEndpoint(
      '/api/social/posts/actions',
      'POST',
      '/api/social/posts/actions',
      {
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        data: {
          post_id: 'test-post-id',
          action: 'publish',
          content: 'Test content',
          post_type: 'post'
        }
      }
    )
    results.push({ name: '/api/social/posts/actions', ...result4 })
  } else {
    log('SKIP: AUTH_TOKEN required', 'yellow')
    results.push({ name: '/api/social/posts/actions', skipped: true })
  }

  // Summary
  log('\n' + '='.repeat(50), 'bright')
  log('Test Summary', 'bright')
  log('='.repeat(50), 'bright')
  
  results.forEach(result => {
    if (result.skipped) {
      log(`⏭️  ${result.name}: SKIPPED (requires AUTH_TOKEN)`, 'yellow')
    } else if (result.success) {
      log(`✅ ${result.name}: SUCCESS (${result.status})`, 'green')
    } else {
      log(`❌ ${result.name}: FAILED (${result.status || 'error'})`, 'red')
    }
  })

  const successCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success && !r.skipped).length
  const skippedCount = results.filter(r => r.skipped).length

  log(`\nTotal: ${results.length} | ✅ ${successCount} | ❌ ${failedCount} | ⏭️  ${skippedCount}`, 'bright')
  
  log('\nTo get AUTH_TOKEN:', 'cyan')
  log('  1. Open browser console', 'cyan')
  log('  2. Run: await supabase.auth.getSession()', 'cyan')
  log('  3. Copy the access_token value', 'cyan')
  log('  4. Run: node test-social-endpoints.js YOUR_TOKEN', 'cyan')
}

runTests().catch(console.error)

