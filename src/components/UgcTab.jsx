import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import './UgcTab.css'

export default function UgcTab() {
  const { user } = useAuth()
  
  const [ugcPosts, setUgcPosts] = useState([])
  const [ugcLoading, setUgcLoading] = useState(false)
  const [ugcFormData, setUgcFormData] = useState({ 
    productName: '', 
    productDetails: '', 
    productImage: null,
    productImageUrl: null
  })
  const [ugcUploading, setUgcUploading] = useState(false)
  const [productDragActive, setProductDragActive] = useState(false)

  // UGC data haku
  const fetchUgcPosts = async () => {
    if (!user) return
    
    try {
      setUgcLoading(true)
      
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        return
      }
      
      // Haetaan kaikki postaukset content-taulusta
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'Deleted')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setUgcPosts(data || [])
    } catch (err) {
      console.error('Virhe UGC datan haussa:', err)
    } finally {
      setUgcLoading(false)
    }
  }

  // Hae UGC data kun komponentti mountataan
  useEffect(() => {
    if (user) {
      fetchUgcPosts()
    }
  }, [user])

  // UGC kuvan upload handler
  const handleImageUpload = async (file, type) => {
    if (!file) return null

    try {
      setUgcUploading(true)

      // Upload kuva Supabase temp-ingest bucketiin
      const userId = await getUserOrgId(user.id)
      if (!userId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const bucket = 'temp-ingest'
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const path = `${userId}/ugc/${Date.now()}-${safeName}`
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { 
          upsert: true, 
          contentType: file.type || 'image/jpeg' 
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Hae julkinen URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      const imageUrl = urlData.publicUrl

      // Päivitä form data
      if (type === 'product') {
        setUgcFormData(prev => ({ ...prev, productImageUrl: imageUrl, productImage: file }))
      }

      return imageUrl
    } catch (err) {
      console.error('Virhe kuvan uploadissa:', err)
      alert('Virhe kuvan uploadissa: ' + err.message)
      return null
    } finally {
      setUgcUploading(false)
    }
  }

  // UGC form submit handler
  const handleUgcSubmit = async (e) => {
    e.preventDefault()
    
    // Validoi pakolliset kentät
    if (!ugcFormData.productName.trim() || 
        !ugcFormData.productDetails.trim() || 
        !ugcFormData.productImageUrl) {
      alert('Täytä kaikki kentät ja lataa tuotteen kuva')
      return
    }
    
    try {
      setUgcUploading(true)

      // Hae session token autentikointia varten
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        throw new Error('Session expired or invalid. Please log in again.')
      }

      // Lähetä data N8N:ään
      const response = await axios.post('/api/ugc-video', {
        productName: ugcFormData.productName,
        productDetails: ugcFormData.productDetails,
        productImageUrl: ugcFormData.productImageUrl
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.data.success) {
        alert('UGC-video pyyntö lähetetty onnistuneesti!')
        
        // Tyhjennä formi
        setUgcFormData({ 
          productName: '', 
          productDetails: '', 
          productImage: null,
          productImageUrl: null
        })
        
        // Päivitä lista
        await fetchUgcPosts()
      }
    } catch (err) {
      console.error('Virhe UGC-video pyynnön lähettämisessä:', err)
      alert('Virhe UGC-video pyynnön lähettämisessä: ' + (err.response?.data?.error || err.message))
    } finally {
      setUgcUploading(false)
    }
  }

  return (
    <div className="ugc-container">
      {/* Formi - 1/4 leveys */}
      <div className="ugc-form-section">
        <form onSubmit={handleUgcSubmit} className="ugc-form">
          <h3>Luo uusi UGC-postaus</h3>
          
          {/* Tuote (kuva) */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-product-image">Tuote (kuva) *</label>
            {ugcFormData.productImageUrl ? (
              <div className="ugc-image-preview">
                <img src={ugcFormData.productImageUrl} alt="Tuote" />
                <button
                  type="button"
                  onClick={() => setUgcFormData(prev => ({ ...prev, productImageUrl: null, productImage: null }))}
                  className="ugc-remove-image"
                  disabled={ugcUploading}
                >
                  ✕ Poista
                </button>
              </div>
            ) : (
              <div
                className={`ugc-drag-drop-zone ${productDragActive ? 'drag-active' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setProductDragActive(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setProductDragActive(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setProductDragActive(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type.startsWith('image/')) {
                    handleImageUpload(file, 'product')
                  }
                }}
                onClick={() => document.getElementById('ugc-product-image').click()}
              >
                <div className="ugc-drag-drop-content">
                  <div className="ugc-drag-drop-icon">📷</div>
                  <p className="ugc-drag-drop-text">Raahaa kuva tähän tai klikkaa valitaksesi</p>
                  <p className="ugc-drag-drop-hint">JPG, PNG, GIF (max 10MB)</p>
                </div>
                <input
                  type="file"
                  id="ugc-product-image"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'product')
                    }
                  }}
                  className="ugc-file-input-hidden"
                  disabled={ugcUploading}
                />
              </div>
            )}
          </div>

          {/* Tuotteen nimi */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-product-name">Tuotteen nimi *</label>
            <input
              type="text"
              id="ugc-product-name"
              value={ugcFormData.productName}
              onChange={(e) => setUgcFormData({ ...ugcFormData, productName: e.target.value })}
              placeholder="Kirjoita tuotteen nimi..."
              className="ugc-input"
              disabled={ugcUploading}
            />
          </div>

          {/* Tuotteen tiedot */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-product-details">Tuotteen tiedot *</label>
            <textarea
              id="ugc-product-details"
              value={ugcFormData.productDetails}
              onChange={(e) => setUgcFormData({ ...ugcFormData, productDetails: e.target.value })}
              placeholder="Kirjoita tuotteen tiedot..."
              rows={4}
              className="ugc-textarea"
              disabled={ugcUploading}
            />
          </div>

          <button 
            type="submit" 
            className="ugc-submit-btn" 
            disabled={
              ugcUploading || 
              !ugcFormData.productName.trim() || 
              !ugcFormData.productDetails.trim() || 
              !ugcFormData.productImageUrl
            }
          >
            {ugcUploading ? (
              <>
                <span className="ugc-loading-spinner"></span>
                Lähetetään...
              </>
            ) : (
              'Luo UGC-video'
            )}
          </button>
        </form>
      </div>

      {/* Postaukset - 3/4 leveys */}
      <div className="ugc-posts-section">
        {ugcLoading ? (
          <div className="ugc-loading">Ladataan...</div>
        ) : ugcPosts.length === 0 ? (
          <div className="ugc-empty">Ei postauksia vielä</div>
        ) : (
          <div className="ugc-posts-list">
            {ugcPosts.map((post) => (
              <div key={post.id} className="ugc-post-item">
                <div className="ugc-post-header">
                  <h4>{post.idea || 'Nimetön postaus'}</h4>
                  <span className="ugc-post-type">{post.type}</span>
                </div>
                <div className="ugc-post-meta">
                  <span className="ugc-post-status">{post.status}</span>
                  <span className="ugc-post-date">
                    {new Date(post.created_at).toLocaleDateString('fi-FI')}
                  </span>
                </div>
                {post.caption && (
                  <p className="ugc-post-caption">{post.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

