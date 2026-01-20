import { supabase } from '../lib/supabase'
import styles from './Sidebar.module.css'

export function OpenBuilderButton() {
  const handleOpenBuilder = async () => {
    // 1. Hae nykyinen sessio
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      alert('Kirjaudu ensin sisään!')
      return
    }

    // 2. Määritä uuden sovelluksen URL
    const builderUrl = import.meta.env.DEV 
      ? 'http://localhost:3001' // Next.js pyörii portissa 3000
      : import.meta.env.VITE_BUILDER_URL // Tuotannon URL

    // 3. Rakenna "Handoff URL" (tokenit hashissa)
    const handoffUrl = `${builderUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`

    // 4. Avaa uusi välilehti
    window.open(handoffUrl, '_blank')
  }

  return (
    <li className={styles['nav-item']}>
      <button
        className={styles['nav-link']}
        onClick={handleOpenBuilder}
        type="button"
      >
        <span className={styles['nav-icon']}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        Avaa Sivustorakentaja
      </button>
    </li>
  )
}
