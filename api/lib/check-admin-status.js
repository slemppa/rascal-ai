// api/lib/check-admin-status.js - Apufunktio admin-statuksen tarkistukseen
// Käytä tätä backend API-reiteissä sen sijaan että tekisit erillisen HTTP-kutsun

/**
 * Tarkistaa onko käyttäjä järjestelmän admin
 * @param {Object} supabase - Supabase client instance
 * @param {string} authUserId - Käyttäjän auth_user_id
 * @returns {Promise<boolean>} true jos käyttäjä on admin, muuten false
 */
export async function checkAdminStatus(supabase, authUserId) {
  try {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error || !userRow) {
      console.error('[checkAdminStatus] Error or no user found:', error)
      return false
    }
    
    // Admin-oikeudet: users.role === 'admin'
    // Huom: company_id === 1 tarkistus poistettu, koska se on "magic number"
    // Jos haluat tukea tätä, käytä ympäristömuuttujaa: process.env.ADMIN_COMPANY_ID
    const isAdmin = userRow.role === 'admin' || userRow.role === 'superadmin'
    
    return isAdmin
  } catch (error) {
    console.error('[checkAdminStatus] Exception:', error)
    return false
  }
}

/**
 * Tarkistaa onko käyttäjä moderaattori tai admin
 * @param {Object} supabase - Supabase client instance
 * @param {string} authUserId - Käyttäjän auth_user_id
 * @returns {Promise<boolean>} true jos käyttäjä on moderator tai admin
 */
export async function checkModeratorStatus(supabase, authUserId) {
  try {
    const { data: userRow, error } = await supabase
      .from('users')
      .select('role')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (error || !userRow) {
      return false
    }
    
    return ['moderator', 'admin', 'superadmin'].includes(userRow.role)
  } catch (error) {
    console.error('[checkModeratorStatus] Exception:', error)
    return false
  }
}


