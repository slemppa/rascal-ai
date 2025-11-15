// src/lib/getUserOrgId.js
// Helper-funktio joka palauttaa oikean user_id (organisaation ID)
// Toimii sekä normaaleille käyttäjille että kutsutuille käyttäjille

import { supabase } from './supabase'

/**
 * Hakee oikean user_id (organisaation ID) auth_user_id:stä
 * @param {string} authUserId - auth.users.id
 * @returns {Promise<string|null>} - public.users.id (organisaation ID) tai null jos ei löydy
 */
export async function getUserOrgId(authUserId) {
  if (!authUserId) {
    return null
  }

  try {
    // 1. Tarkista onko käyttäjä kutsuttu käyttäjä (on org_members taulussa)
    const { data: orgMember, error: orgError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (!orgError && orgMember?.org_id) {
      // Käyttäjä on kutsuttu käyttäjä, palauta organisaation ID
      return orgMember.org_id
    }

    // 2. Jos ei löydy org_members taulusta, tarkista onko normaali käyttäjä
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .maybeSingle()

    if (!userError && userData?.id) {
      // Normaali käyttäjä, palauta users.id
      return userData.id
    }

    return null
  } catch (error) {
    console.error('Error in getUserOrgId:', error)
    return null
  }
}

