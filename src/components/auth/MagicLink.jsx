import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function MagicLink() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleMagicLink = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        }
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Tarkista sähköpostisi taikaliinkin varalta!')
      }
    } catch (error) {
      setMessage('Odottamaton virhe tapahtui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Taikaliinki</h2>
      <p className="text-gray-600 text-center mb-6">
        Syötä sähköpostiosoitteesi, niin lähetämme sinulle taikaliinkin kirjautumista varten.
      </p>
      
      <form onSubmit={handleMagicLink} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Sähköposti
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="sähköposti@esimerkki.fi"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Lähetetään taikaliinkkiä...' : 'Lähetä taikaliinki'}
        </button>
        
        {message && (
          <div className={`p-3 rounded-md text-sm ${
            message.includes('virhe') || message.includes('Error') 
              ? 'bg-red-50 text-red-800 border border-red-200' 
              : 'bg-green-50 text-green-800 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </form>
      
      <p className="mt-6 text-center text-sm text-gray-600">
        Haluatko käyttää salasanaa?{' '}
        <Link to="/signin" className="font-medium text-blue-600 hover:text-blue-500">
          Kirjaudu salasanalla
        </Link>
      </p>
    </div>
  )
}