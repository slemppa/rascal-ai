import { useAuth } from '../contexts/AuthContext'

export function useFeatures() {
  const { user } = useAuth()
  
  // Käytä suoraan käyttäjän tietoja contextista
  const features = Array.isArray(user?.features) ? user.features : []
  
  // Set-tietorakenne nopeaa hakua varten
  const featureSet = new Set(features)
  const has = (name) => featureSet.has(name)

  return { 
    features, 
    has, 
    crmConnected: false, // Tämän voi myös lisätä user-objektiin backendissä jos tarpeen
    loading: false, 
    error: null 
  }
}
