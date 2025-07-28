import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isValidSession, setIsValidSession] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleTokenVerification = async () => {
      try {
        // Tarkista onko token_hash URL:ssa
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type === 'recovery') {
          // Verify OTP recovery tokenille
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'recovery'
          })
          
          if (error) {
            console.error('Error verifying recovery token:', error.message)
            setMessage('Virheellinen tai vanhentunut palautuslinkki')
            setIsVerifying(false)
            return
          }
          
          if (data.session) {
            setIsValidSession(true)
            setMessage('Syötä uusi salasanasi alle')
          }
        } else {
          // Fallback: tarkista onko sessio jo olemassa
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setIsValidSession(true)
          } else {
            setMessage('Virheellinen tai vanhentunut palautuslinkki')
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setMessage('Odottamaton virhe tapahtui')
      } finally {
        setIsVerifying(false)
      }
    }

    handleTokenVerification()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidSession(true)
          setMessage('Syötä uusi salasanasi alle')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [searchParams])

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage('Salasanat eivät täsmää')
      return
    }
    
    if (password.length < 6) {
      setMessage('Salasanan tulee olla vähintään 6 merkkiä pitkä')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Salasana päivitetty onnistuneesti!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      setMessage('Odottamaton virhe tapahtui')
    } finally {
      setLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Vahvistetaan palautuslinkkiä...</p>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Virheellinen linkki</h2>
          <p className="text-gray-600 mb-4">
            {message || 'Tämä salasanan palautuslinkki on virheellinen tai vanhentunut.'}
          </p>
          <button
            onClick={() => navigate('/signin')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Takaisin kirjautumiseen
          </button>
        </div>
      </div>
    )
  }

  // Loput komponentin koodi pysyy samana...
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Aseta uusi salasana</h2>
      
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Uusi salasana
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Vähintään 6 merkkiä"
          />
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Vahvista uusi salasana
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Vahvista uusi salasanasi"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Päivitetään salasanaa...' : 'Päivitä salasana'}
        </button>
        
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('onnistuneesti') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}