// Status-mappaus Supabase → UI
export const POST_STATUS_MAP = {
  'Draft': 'Kesken',
  'In Progress': 'Kesken', 
  'Under Review': 'Tarkistuksessa',
  'Scheduled': 'Aikataulutettu',
  'Done': 'Tarkistuksessa',
  'Published': 'Julkaistu',
  'Deleted': 'Poistettu'
}

// Käänteinen mappaus UI → Supabase
export const POST_STATUS_REVERSE_MAP = {
  'Kesken': 'In Progress',
  'KeskenSupabase': 'In Progress',
  'Tarkistuksessa': 'Under Review',
  'Aikataulutettu': 'Scheduled',
  'Julkaistu': 'Published'
}

// Mixpost status-mappaus
export const MIXPOST_STATUS_MAP = {
  'published': 'Julkaistu',
  'scheduled': 'Aikataulutettu', 
  'draft': 'Luonnos',
  'failed': 'Epäonnistui'
}

// Post-tyypit
export const POST_TYPES = {
  PHOTO: 'Photo',
  REEL: 'Reel',
  REELS: 'Reels',
  CAROUSEL: 'Carousel',
  AVATAR: 'Avatar',
  BLOG: 'Blog',
  NEWSLETTER: 'Newsletter'
}

// Post-statusit (UI)
export const POST_STATUSES = {
  KESKEN: 'Kesken',
  TARKISTUKSESSA: 'Tarkistuksessa',
  AIKATAULUTETTU: 'Aikataulutettu',
  JULKAISTU: 'Julkaistu',
  POISTETTU: 'Poistettu'
}

// Default features
export const DEFAULT_FEATURES = [
  'Social Media',
  'Phone Calls',
  'Email marketing integration',
  'Marketing assistant'
]

