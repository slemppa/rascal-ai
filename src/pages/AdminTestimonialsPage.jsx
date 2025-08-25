import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileNavigation from '../components/MobileNavigation'
import './AdminBlogPage.css'
import { supabase } from '../lib/supabase'

export default function AdminTestimonialsPage({ embedded = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })
  const [dragActiveAvatar, setDragActiveAvatar] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [tempAvatarPreview, setTempAvatarPreview] = useState('')

  const fetchAll = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, name, title, company, quote, avatar_url, published, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (e) {
      console.error('Failed to fetch testimonials', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const save = async (updated) => {
    try {
      setLoading(true)
      const { id, ...fields } = updated
      const { data, error } = await supabase
        .from('testimonials')
        .update(fields)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      setItems(prev => prev.map(it => it.id === data.id ? data : it))
      if (form.id === id) setForm({ ...form, ...data })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const edit = (item) => setForm({ ...item })

  const remove = async (id) => {
    if (!confirm('Poistetaanko?')) return
    try {
      setLoading(true)
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id)
      if (error) throw error
      setItems(prev => prev.filter(it => it.id !== id))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="admin-main">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 20 }}>
            <h2 style={{ marginTop: 0 }}> {form.id ? 'Muokkaa suositusta' : 'Lisää uusi suositus'} </h2>
            <div className="article-form" style={{ padding: 0 }}>
              <div className="form-group">
                <label>Nimi</label>
                <input placeholder="Nimi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Titteli</label>
                  <input placeholder="Titteli" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Yritys</label>
                  <input placeholder="Yritys" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Kuva</label>
                <div 
                  className={`image-upload-area ${dragActiveAvatar ? 'drag-active' : ''} ${uploadingAvatar ? 'uploading' : ''}`}
                  onDragEnter={(e)=>{e.preventDefault();e.stopPropagation();setDragActiveAvatar(true)}}
                  onDragOver={(e)=>{e.preventDefault();e.stopPropagation();setDragActiveAvatar(true)}}
                  onDragLeave={(e)=>{e.preventDefault();e.stopPropagation();setDragActiveAvatar(false)}}
                  onDrop={(e)=>{
                    e.preventDefault(); e.stopPropagation(); setDragActiveAvatar(false);
                    const files = [...e.dataTransfer.files]
                    if (files && files[0]) {
                      const file = files[0]
                      if (!file.type?.startsWith('image/')) { alert('Vain kuvatiedostot sallittu'); return }
                      if (file.size > 5*1024*1024) { alert('Kuva on liian suuri (max 5MB)'); return }
                      setUploadingAvatar(true)
                      const reader = new FileReader()
                      reader.onload = () => {
                        setTempAvatarPreview(String(reader.result || ''))
                        setForm(prev => ({ ...prev, avatar_file: file }))
                        setUploadingAvatar(false)
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                >
                  {uploadingAvatar ? (
                    <div className="upload-progress">
                      <div className="upload-spinner"></div>
                      <p>Ladataan esikatselua…</p>
                    </div>
                  ) : (tempAvatarPreview || form.avatar_url) ? (
                    <div className="uploaded-image">
                      <img src={tempAvatarPreview || form.avatar_url} alt="Kuvan esikatselu" />
                      <div className="image-actions">
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => { setTempAvatarPreview(''); setForm(prev => ({ ...prev, avatar_file: null, avatar_url: '' })) }}
                        >
                          Poista kuva
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <div className="upload-icon">📷</div>
                      <h3>Raahaa kuva tähän tai klikkaa valitaksesi</h3>
                      <p>Tuetut formaatit: JPG, PNG, GIF (max 5MB)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (!file.type?.startsWith('image/')) { alert('Vain kuvatiedostot sallittu'); return }
                          if (file.size > 5*1024*1024) { alert('Kuva on liian suuri (max 5MB)'); return }
                          setUploadingAvatar(true)
                          const reader = new FileReader()
                          reader.onload = () => {
                            setTempAvatarPreview(String(reader.result || ''))
                            setForm(prev => ({ ...prev, avatar_file: file }))
                            setUploadingAvatar(false)
                          }
                          reader.readAsDataURL(file)
                        }}
                        className="file-input"
                      />
                    </div>
                  )}
                </div>
                <details className="manual-url-section" style={{ marginTop: 12 }}>
                  <summary>Tai syötä kuvan URL manuaalisesti</summary>
                  <input placeholder="https://..." value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} className="manual-url-input" />
                </details>
              </div>
              <div className="form-group">
                <label>Suositus</label>
                <textarea placeholder="Lyhyt suositus" rows={5} value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="radio-label" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="checkbox" checked={!!form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
                  <span className="radio-text">Julkaistu</span>
                </label>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={async () => {
                  // Lähetä aina webhookiin; lisää tiedosto jos on
                  const fd = new FormData()
                  fd.append('action', form.id ? 'update' : 'create')
                  if (form.id) fd.append('id', form.id)
                  fd.append('name', form.name || '')
                  fd.append('title', form.title || '')
                  fd.append('company', form.company || '')
                  fd.append('quote', form.quote || '')
                  fd.append('published', String(!!form.published))
                  if (form.avatar_url) fd.append('avatar_url', form.avatar_url)
                  if (form.avatar_file) fd.append('avatar', form.avatar_file)
                  try {
                    setLoading(true)
                    const resp = await fetch('/api/testimonials-management', { method: 'POST', body: fd })
                    if (!resp.ok) throw new Error('Upload failed')
                    setForm({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })
                    setTempAvatarPreview('')
                    await fetchAll()
                  } catch (e) {
                    console.error(e)
                  } finally {
                    setLoading(false)
                  }
                }} disabled={loading || !form.name || !form.quote}>{form.id ? 'Tallenna' : 'Lähetä'}</button>
                {form.id && <button className="btn btn-secondary" onClick={() => setForm({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })}>Peruuta</button>}
              </div>
            </div>
          </div>

        <div className="articles-list" style={{ background: '#fff', borderRadius: 20, padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Lista</h2>
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ladataan…</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map(item => (
                  <div key={item.id} className="table-row" style={{ gridTemplateColumns: 'auto 2fr auto auto', alignItems: 'center', gap: 12 }}>
                    <div className="cell" style={{ padding: 0 }}>
                      <img src={item.avatar_url || '/placeholder.png'} alt="avatar" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    </div>
                    <div className="cell" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{[item.title, item.company].filter(Boolean).join(', ')}</div>
                      <div style={{ fontSize: 14, marginTop: 6, color: '#111827' }}>“{item.quote}”</div>
                    </div>
                    <div className="cell" style={{ gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <input type="checkbox" checked={!!item.published} onChange={async e => { await save({ ...item, published: e.target.checked }) }} />
                        {item.published ? 'Julkaistu' : 'Piilotettu'}
                      </label>
                    </div>
                    <div className="cell actions-cell">
                      <button className="btn btn-small btn-secondary" onClick={() => edit(item)}>Muokkaa</button>
                      <button className="btn btn-small btn-danger" onClick={() => remove(item.id)}>Poista</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )

  if (embedded) return content

  return (
    <div className="app-layout">
      <Sidebar />
      <MobileNavigation />
      <div className="admin-blog-page">
        <div className="layout-container">
          <header className="admin-header">
            <div className="header-content">
              <h1 className="page-title">Hallinta</h1>
              <p className="page-description">Testimonials</p>
            </div>
          </header>
          {content}
        </div>
      </div>
    </div>
  )
}


