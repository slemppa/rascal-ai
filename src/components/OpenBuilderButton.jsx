import { supabase } from '../lib/supabase'

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
      ? 'http://localhost:3000' // Next.js pyörii portissa 3000
      : 'https://builder.rascal-ai.com' // Tuotannon URL

    // 3. Rakenna "Handoff URL" (tokenit hashissa)
    const handoffUrl = `${builderUrl}/auth/handoff#access_token=${session.access_token}&refresh_token=${session.refresh_token}`

    // 4. Avaa uusi välilehti
    window.open(handoffUrl, '_blank')
  }

  return (
    <button onClick={handleOpenBuilder} className="btn-primary">
      Avaa Sivustorakentaja 🚀
    </button>
  )
}
