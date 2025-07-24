import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    console.log('Trying to sign in with:', email) // DEBUG
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      console.log('Sign in result:', { data, error }) // DEBUG

      if (error) {
        console.log('Login failed:', error.message)
        setError(error.message)
      } else {
        console.log('Login success, navigating to dashboard')
        navigate('/dashboard')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Kirjaudu sisään</h2>
      
      <form onSubmit={handleSignIn} className="space-y-4">
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="sähköposti@esimerkki.fi"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Salasana
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="Salasanasi"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Kirjaudutaan...' : 'Kirjaudu sisään'}
        </button>
        
        {error && (
          <div className="p-3 rounded-md text-sm bg-red-50 text-red-800 border border-red-200">
            {error}
          </div>
        )}
      </form>
      
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Unohditko salasanan?
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          Eikö sinulla ole tiliä?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Rekisteröidy
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          <Link to="/magic-link" className="font-medium text-purple-600 hover:text-purple-500">
            Kirjaudu taikaliinillä
          </Link>
        </p>
      </div>
    </div>
  )
}