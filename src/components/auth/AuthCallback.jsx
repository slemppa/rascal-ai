import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
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
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Käsitellään kirjautumista...</p>
      </div>
    </div>
  )
}