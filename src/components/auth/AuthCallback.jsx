import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Tarkista onko token_hash parametrit URL:ssa
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type) {
          // Verify OTP kun tulee email linkistä (signup, recovery, email_change, jne.)
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type
          })
          
          if (error) {
            console.error('Error verifying OTP:', error.message)
            navigate('/signin?error=' + encodeURIComponent(error.message))
            return
          }
          
          if (data.session) {
            // Sähköpostin vaihdon jälkeen ohjaa settings-sivulle
            if (type === 'email_change') {
              navigate('/settings?email=changed')
            } else {
              navigate('/dashboard')
            }
            return
          }
        }

        // Fallback: tarkista onko sessio jo olemassa
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error during auth callback:', error.message)
          navigate('/signin?error=' + encodeURIComponent(error.message))
        } else if (data.session) {
          navigate('/dashboard')
        } else {
          navigate('/signin')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        navigate('/signin?error=' + encodeURIComponent('Odottamaton virhe tapahtui'))
      }
    }

    handleAuthCallback()
  }, [navigate, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Käsitellään kirjautumista...</p>
      </div>
    </div>
  )
}