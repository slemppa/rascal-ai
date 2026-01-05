import axios from 'axios'
import { supabase } from '../lib/supabase'

/**
 * Hakee kirjautuneen käyttäjän tiedot turvallisen API-endpointin kautta
 * @returns {Promise<Object>} Käyttäjän tiedot
 */
export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No active session')
  }
  
  const response = await axios.get('/api/users/me', {
    headers: { Authorization: `Bearer ${session.access_token}` }
  })
  
  return response.data
}

/**
 * Tarkistaa onko käyttäjä admin users.role perusteella
 * @returns {Promise<boolean>} true jos käyttäjä on admin, muuten false
 */
export async function isAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return false
  }
  
  try {
    const response = await axios.get('/api/users/is-admin', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    
    return response.data.isAdmin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
