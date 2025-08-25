import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import MobileNavigation from '../components/MobileNavigation'

export default function AdminTestimonialsPage({ embedded = false }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })

  const fetchAll = async () => {
    try {
      setLoading(true)
      const token = (await import('../lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token
      const res = await fetch('/api/admin-testimonials', {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
      const json = await res.json()
      setItems(json.data || [])
    } catch (e) {
      console.error('Failed to fetch testimonials', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const save = async () => {
    try {
      setLoading(true)
      const token = (await import('../lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token
      const method = form.id ? 'PUT' : 'POST'
      const res = await fetch('/api/admin-testimonials', {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error('Save failed')
      setForm({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })
      await fetchAll()
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
      const token = (await import('../lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token
      const res = await fetch(`/api/admin-testimonials?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      })
      if (!res.ok) throw new Error('Delete failed')
      await fetchAll()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const content = (
    <div className="main-content" style={{ padding: 20 }}>
      <h1>Testimonials-hallinta</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>{form.id ? 'Muokkaa' : 'Lisää uusi'}</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              <input placeholder="Nimi" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Titteli" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <input placeholder="Yritys" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
              <input placeholder="Avatar URL" value={form.avatar_url} onChange={e => setForm({ ...form, avatar_url: e.target.value })} />
              <textarea placeholder="Suositus" rows={5} value={form.quote} onChange={e => setForm({ ...form, quote: e.target.value })} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={!!form.published} onChange={e => setForm({ ...form, published: e.target.checked })} />
                Julkaistu
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={save} disabled={loading || !form.name || !form.quote}>{form.id ? 'Tallenna' : 'Luo'}</button>
                {form.id && <button className="btn btn-secondary" onClick={() => setForm({ id: null, name: '', title: '', company: '', quote: '', avatar_url: '', published: true })}>Peruuta</button>}
              </div>
            </div>
          </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
            <h2 style={{ marginTop: 0 }}>Lista</h2>
            {loading ? <p>Ladataan…</p> : (
              <div style={{ display: 'grid', gap: 12 }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                    <img src={item.avatar_url || '/placeholder.png'} alt="avatar" width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{[item.title, item.company].filter(Boolean).join(', ')}</div>
                      <div style={{ fontSize: 14, marginTop: 6, color: '#111827' }}>“{item.quote}”</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <input type="checkbox" checked={!!item.published} onChange={async e => { await save({ ...item, published: e.target.checked }) }} disabled />
                      {item.published ? 'Julkaistu' : 'Piilotettu'}
                    </label>
                    <button className="btn btn-secondary" onClick={() => edit(item)}>Muokkaa</button>
                    <button className="btn" onClick={() => remove(item.id)} style={{ background: '#ef4444' }}>Poista</button>
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
      {content}
    </div>
  )
}


