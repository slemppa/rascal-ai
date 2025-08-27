import React, { useState, useEffect, useMemo } from 'react'
import pkg from '../../package.json'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import '../components/ModalComponents.css'
import './AdminPage.css'

export default function AdminPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [content, setContent] = useState([])
  const [callLogs, setCallLogs] = useState([])
  const [messageLogs, setMessageLogs] = useState([])
  const [segments, setSegments] = useState([])
  const [variables, setVariables] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [updateTimeout, setUpdateTimeout] = useState(null)
  const [modalChanges, setModalChanges] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [showUserIds, setShowUserIds] = useState(false)
  const [featureAddSelection, setFeatureAddSelection] = useState({})
  const [featuresOpen, setFeaturesOpen] = useState({})

  const ALL_FEATURES = [
    'Campaigns',
    'Segments',
    'CRM',
    'Phone Calls',
    'Social Media',
    'Marketing assistant',
    'Email marketing integration'
  ]

  const KNOWN_FEATURES = useMemo(() => {
    const set = new Set(ALL_FEATURES)
    for (const u of users || []) {
      const arr = Array.isArray(u.features) ? u.features : []
      for (const f of arr) set.add(f)
    }
    return Array.from(set).sort()
  }, [users])

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin, activeTab])

  // Cleanup timeout kun komponentti unmountataan
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
    }
  }, [updateTimeout])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role, company_id')
        .eq('auth_user_id', user.id)
        .single()

      if (error) {
        console.error('Error checking admin status:', error)
        return
      }

      // Admin on käyttäjä, jolla on role = 'admin' tai company_id = 1 (pääadmin)
      setIsAdmin(userData?.role === 'admin' || userData?.company_id === 1)
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'users') {
        await loadUsers()
      } else if (activeTab === 'content') {
        await loadContent()
      } else if (activeTab === 'calls') {
        await loadCallLogs()
      } else if (activeTab === 'messages') {
        await loadMessageLogs()
      } else if (activeTab === 'segments') {
        await loadSegments()
      } else if (activeTab === 'system') {
        await loadSystemStats()
      }
    } catch (error) {
      setError('Virhe tietojen lataamisessa: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin-data?type=users', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setUsers(result.users || [])
      } else {
        throw new Error(result.error || 'Failed to fetch users')
      }
    } catch (error) {
      throw error
    }
  }

  const loadContent = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin-data?type=content', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setContent(result.content || [])
      } else {
        throw new Error(result.error || 'Failed to fetch content')
      }
    } catch (error) {
      throw error
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      setError('Virhe roolin päivittämisessä: ' + error.message)
    }
  }

  const updateUserField = async (userId, field, value) => {
    // Päivitä käyttäjätieto heti UI:ssa
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, [field]: value }))
    }
    
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ))

    // Debounce API-kutsu
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }

    const timeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({ [field]: value })
          .eq('id', userId)

        if (error) throw error
      } catch (error) {
        setError(`Virhe kentän ${field} päivittämisessä: ` + error.message)
        // Palauta alkuperäinen arvo jos päivitys epäonnistui
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, [field]: user[field] } : user
        ))
      }
    }, 500) // 500ms viive

    setUpdateTimeout(timeout)
  }

  // Suodata käyttäjät haun perusteella
  const filteredUsers = users.filter(user => 
    user.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Avaa modaali ja päivitä käyttäjätiedot
  const openUserModal = (user) => {
    // Etsi päivitetyt käyttäjätiedot listasta
    const updatedUser = users.find(u => u.id === user.id)
    setSelectedUser(updatedUser || user)
    setModalChanges({}) // Tyhjennä muutokset
  }

  // Päivitä modaalin kenttä ilman tallennusta
  const updateModalField = (field, value) => {
    setModalChanges(prev => ({ ...prev, [field]: value }))
  }

  // Tallenna kaikki muutokset
  const saveModalChanges = async () => {
    if (Object.keys(modalChanges).length === 0) {
      setSelectedUser(null)
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update(modalChanges)
        .eq('id', selectedUser.id)

      if (error) throw error

      // Päivitä käyttäjätieto listassa
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, ...modalChanges } : user
      ))

      // Päivitä selectedUser
      setSelectedUser(prev => ({ ...prev, ...modalChanges }))
      
      setModalChanges({})
      setSelectedUser(null)
    } catch (error) {
      setError(`Virhe muutosten tallentamisessa: ` + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Sulje modaali ilman tallennusta
  const closeModal = () => {
    setSelectedUser(null)
    setModalChanges({})
  }

  const deleteUser = async (userId) => {
    if (!confirm('Oletko varma, että haluat poistaa tämän käyttäjän?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      setError('Virhe käyttäjän poistamisessa: ' + error.message)
    }
  }

  const deleteContent = async (contentId) => {
    if (!confirm('Oletko varma, että haluat poistaa tämän sisällön?')) return

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId)

      if (error) throw error
      await loadContent()
    } catch (error) {
      setError('Virhe sisällön poistamisessa: ' + error.message)
    }
  }

  const loadCallLogs = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin-call-logs', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setCallLogs(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch call logs')
      }
    } catch (error) {
      throw error
    }
  }

  const loadMessageLogs = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin-message-logs', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Admin message logs response:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setMessageLogs(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch message logs')
      }
    } catch (error) {
      console.error('Error loading message logs:', error)
      setMessageLogs([]) // Aseta tyhjä array virheen sattuessa
      throw error
    }
  }

  const loadSegments = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin-data?type=segments', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setSegments(result.segments || [])
      } else {
        throw new Error(result.error || 'Failed to fetch segments')
      }
    } catch (error) {
      throw error
    }
  }

  const loadSystemStats = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin-data?type=stats', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setStats(result.stats)
      } else {
        throw new Error(result.error || 'Failed to fetch stats')
      }
    } catch (error) {
      throw error
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-access-denied">
          <h2>Pääsy estetty</h2>
          <p>Sinulla ei ole oikeuksia admin-paneeliin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Hallinta</h1>
        <p>Järjestelmän hallintapaneeli</p>
      </div>

      {error && (
        <div className="admin-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Käyttäjät ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Sisältö ({content.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveTab('calls')}
        >
          Puhelut ({callLogs.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Viestit ({messageLogs.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          Segmentit ({segments.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          Järjestelmä
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">Ladataan...</div>
        ) : (
          <>
                         {activeTab === 'users' && (
               <div className="admin-section">
                 <div className="admin-header-row">
                   <h2>Käyttäjät ({filteredUsers.length})</h2>
                   <div className="admin-controls">
                     <button
                       className="admin-btn admin-btn-secondary"
                       onClick={() => setShowUserIds(!showUserIds)}
                     >
                       {showUserIds ? 'Piilota ID:t' : 'Näytä ID:t'}
                     </button>
                   <div className="admin-search">
                     <input
                       type="text"
                       placeholder="Hae nimen, sähköpostin tai yrityksen perusteella..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="search-input"
                     />
                     </div>
                   </div>
                 </div>
                 
                 <div className="admin-table-container">
                   <table className="admin-table">
                     <thead>
                       <tr>
                         <th>Nimi</th>
                         <th>Sähköposti</th>
                         {showUserIds && <th>User ID</th>}
                         <th>Rooli</th>
                         <th>Yritys</th>
                         <th>CRM yhdistetty</th>
                         <th>Featuret</th>
                         <th>Rekisteröitynyt</th>
                         <th>Toiminnot</th>
                       </tr>
                     </thead>
                     <tbody>
                       {filteredUsers.map(user => (
                         <tr key={user.id}>
                           <td>{user.contact_person || 'Nimeä ei asetettu'}</td>
                           <td>{user.contact_email}</td>
                           {showUserIds && <td>{user.auth_user_id || '-'}</td>}
                           <td>
                             <select
                               value={user.role || 'user'}
                               onChange={(e) => updateUserRole(user.id, e.target.value)}
                             >
                               <option value="user">Käyttäjä</option>
                               <option value="admin">Admin</option>
                               <option value="moderator">Moderaattori</option>
                             </select>
                           </td>
                           <td>{user.company_name || 'Ei yritystä'}</td>
                           <td>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <label className="switch" title="CRM yhdistetty">
                                 <input
                                   type="checkbox"
                                   checked={Boolean(user.crm_connected)}
                                   onChange={(e) => updateUserField(user.id, 'crm_connected', e.target.checked)}
                                   aria-label="CRM yhdistetty"
                                 />
                                 <span className="slider" />
                               </label>
                               <span style={{ fontSize: 12, color: user.crm_connected ? '#166534' : '#6b7280' }}>
                                 {user.crm_connected ? 'Kytketty' : 'Ei kytketty'}
                               </span>
                             </div>
                           </td>
                           <td>
                            <div style={{ position: 'relative', marginTop: 8 }}>
                              <button
                                className="admin-btn admin-btn-secondary"
                                onClick={() => setFeaturesOpen(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                              >Näytä</button>
                              <div className="feature-popover" style={{ display: featuresOpen[user.id] ? 'block' : 'none', position: 'absolute', top: 36, left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 260 }}>
                                <div style={{ display: 'grid', gap: 10, maxHeight: 260, overflow: 'auto', paddingRight: 4 }}>
                                  {KNOWN_FEATURES.map(f => {
                                    const enabled = (Array.isArray(user.features) ? user.features : []).includes(f)
                                    return (
                                      <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
                                        <label className="switch">
                                          <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => {
                                              const current = Array.isArray(user.features) ? user.features : []
                                              const next = e.target.checked ? Array.from(new Set([...current, f])) : current.filter(x => x !== f)
                                              updateUserField(user.id, 'features', next)
                                            }}
                                            aria-label={f}
                                          />
                                          <span className="slider" />
                                        </label>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                           <td>{new Date(user.created_at).toLocaleDateString('fi-FI')}</td>
                           <td>
                             <div className="action-buttons">
                               <button
                                 className="admin-btn admin-btn-secondary"
                                 onClick={() => openUserModal(user)}
                                 title="Muokkaa teknisiä ID:tä"
                               >
                                 Muokkaa
                               </button>
                               <button
                                 className="admin-btn admin-btn-danger"
                                 onClick={() => deleteUser(user.id)}
                                 title="Poista käyttäjä"
                               >
                                 Poista
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 {/* Teknisten ID:iden muokkaus modal */}
                 {selectedUser && createPortal(
                   <div className="modal-overlay modal-overlay--light" onClick={closeModal}>
                     <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                       <div className="modal-header">
                         <h2 className="modal-title">Muokkaa käyttäjän teknisiä ID:itä</h2>
                         {Object.keys(modalChanges).length > 0 && (
                           <span style={{ fontSize: '12px', color: '#666' }}>
                             Tallentamattomia muutoksia
                           </span>
                         )}
                         <button
                           className="modal-close-btn"
                           onClick={closeModal}
                         >
                           ✕
                         </button>
                       </div>
                       <div className="modal-content">
                         <div className="form-group">
                           <label className="form-label">Webhook URL</label>
                           <input
                             type="text"
                             className="form-input"
                             value={modalChanges.webhook_url !== undefined ? modalChanges.webhook_url : (selectedUser.webhook_url || '')}
                             onChange={(e) => updateModalField('webhook_url', e.target.value)}
                             placeholder="Webhook URL"
                           />
                         </div>
                         <div className="form-group">
                           <label className="form-label">Thread ID</label>
                           <input
                             type="text"
                             className="form-input"
                             value={modalChanges.thread_id !== undefined ? modalChanges.thread_id : (selectedUser.thread_id || '')}
                             onChange={(e) => updateModalField('thread_id', e.target.value)}
                             placeholder="Thread ID"
                           />
                         </div>
                         <div className="form-group">
                           <label className="form-label">VAPI Number ID</label>
                           <input
                             type="text"
                             className="form-input"
                             value={modalChanges.vapi_number_id !== undefined ? modalChanges.vapi_number_id : (selectedUser.vapi_number_id || '')}
                             onChange={(e) => updateModalField('vapi_number_id', e.target.value)}
                             placeholder="VAPI Number ID"
                           />
                         </div>
                         <div className="form-group">
                           <label className="form-label">VAPI Assistant ID</label>
                           <input
                             type="text"
                             className="form-input"
                             value={modalChanges.vapi_assistant_id !== undefined ? modalChanges.vapi_assistant_id : (selectedUser.vapi_assistant_id || '')}
                             onChange={(e) => updateModalField('vapi_assistant_id', e.target.value)}
                             placeholder="VAPI Assistant ID"
                           />
                         </div>
                         <div className="form-group">
                           <label className="form-label">Vector Store ID</label>
                           <input
                             type="text"
                             className="form-input"
                             value={modalChanges.vector_store_id !== undefined ? modalChanges.vector_store_id : (selectedUser.vector_store_id || '')}
                             onChange={(e) => updateModalField('vector_store_id', e.target.value)}
                             placeholder="Vector Store ID"
                           />
                         </div>
                         <div className="form-group">
                           <label className="form-label">Voice ID</label>
                           <input
                             type="text"
                             className="form-input"
                             value={modalChanges.voice_id !== undefined ? modalChanges.voice_id : (selectedUser.voice_id || '')}
                             onChange={(e) => updateModalField('voice_id', e.target.value)}
                             placeholder="Voice ID"
                           />
                         </div>
                         <div className="form-group">
                           <label className="form-label">Assistant ID</label>
                           <input
                             type="text"
                             className="form-input"
                             value={modalChanges.assistant_id !== undefined ? modalChanges.assistant_id : (selectedUser.assistant_id || '')}
                             onChange={(e) => updateModalField('assistant_id', e.target.value)}
                             placeholder="Assistant ID"
                           />
                         </div>
                         <div className="modal-actions">
                           <div className="modal-actions-left">
                             <button
                               className="cancel-button"
                               onClick={closeModal}
                             >
                               Peruuta
                             </button>
                           </div>
                           <div className="modal-actions-right">
                             <button
                               className="save-button"
                               onClick={saveModalChanges}
                               disabled={isSaving || Object.keys(modalChanges).length === 0}
                             >
                               {isSaving ? 'Tallennetaan...' : 'Tallenna'}
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>,
                   document.body
                 )}
               </div>
             )}

            {activeTab === 'content' && (
              <div className="admin-section">
                <h2>Sisältö</h2>
                <div className="admin-table-container">
                  <table className="admin-table">
                                         <thead>
                       <tr>
                         <th>Idea</th>
                         <th>Tyyppi</th>
                         <th>Luonut</th>
                         <th>Tila</th>
                         <th>Luotu</th>
                         <th>Toiminnot</th>
                       </tr>
                     </thead>
                     <tbody>
                       {content.map(item => (
                         <tr key={item.id}>
                           <td>{item.idea || 'Idea ei asetettu'}</td>
                           <td>{item.type || 'Ei tyyppiä'}</td>
                           <td>{item.users?.contact_person || item.users?.contact_email || 'Tuntematon'}</td>
                           <td>
                             <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                               {item.status || 'Draft'}
                             </span>
                           </td>
                           <td>{new Date(item.created_at).toLocaleDateString('fi-FI')}</td>
                           <td>
                             <button
                               className="admin-btn admin-btn-danger"
                               onClick={() => deleteContent(item.id)}
                             >
                               Poista
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>
              </div>
            )}

                         {activeTab === 'calls' && (
               <div className="admin-section">
                 <h2>Puhelut</h2>
                 <div className="admin-table-container">
                   <table className="admin-table">
                     <thead>
                       <tr>
                         <th>Asiakas</th>
                         <th>Puhelinnumero</th>
                         <th>Käyttäjä</th>
                         <th>Hinta</th>
                         <th>Päivä</th>
                       </tr>
                     </thead>
                     <tbody>
                       {callLogs.map(call => (
                         <tr key={call.id}>
                           <td>{call.customer_name || 'Nimeä ei asetettu'}</td>
                           <td>{call.phone_number}</td>
                           <td>{call.users?.contact_person || call.users?.contact_email || 'Tuntematon'}</td>
                           <td>{call.price ? `€${call.price}` : '-'}</td>
                           <td>{new Date(call.call_date).toLocaleDateString('fi-FI')}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}

             {activeTab === 'messages' && (
               <div className="admin-section">
                 <h2>Viestit / kuukausi</h2>
                 <div className="admin-table-container">
                   {loading ? (
                     <div className="admin-loading">Ladataan viestejä...</div>
                   ) : error ? (
                     <div className="admin-error">
                       <p>❌ Virhe viestien lataamisessa: {error}</p>
                       <button 
                         className="admin-btn admin-btn-secondary"
                         onClick={() => loadData()}
                       >
                         Yritä uudelleen
                       </button>
                     </div>
                   ) : !messageLogs || messageLogs.length === 0 ? (
                     <div className="admin-empty">
                       <p>Ei viestejä löytynyt.</p>
                     </div>
                   ) : (
                     <table className="admin-table">
                       <thead>
                         <tr>
                           <th>Käyttäjä</th>
                           <th>Viestien määrä</th>
                           <th>Kuukausi</th>
                           <th>Kustannus (€)</th>
                         </tr>
                       </thead>
                       <tbody>
                         {(() => {
                           try {
                             // Ryhmitellään messageLogs käyttäjä+kuukausi -tasoille
                             const monthNames = [
                               'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
                               'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
                             ];
                             const groups = {};
                             
                             if (Array.isArray(messageLogs)) {
                               messageLogs.forEach(msg => {
                                 if (msg && msg.created_at) {
                                   const user = msg.users?.contact_person || msg.users?.contact_email || 'Tuntematon';
                                   const date = new Date(msg.created_at);
                                   if (!isNaN(date.getTime())) {
                                     const month = date.getMonth();
                                     const year = date.getFullYear();
                                     const key = `${user}__${year}-${month}`;
                                     if (!groups[key]) {
                                       groups[key] = { user, year, month, count: 0 };
                                     }
                                     groups[key].count++;
                                   }
                                 }
                               });
                             }
                             
                             // Järjestetään tulos uusimmat ensin
                             const sorted = Object.values(groups).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
                             return sorted.map((g, idx) => (
                               <tr key={g.user + g.year + g.month}>
                                 <td>{g.user}</td>
                                 <td>{g.count}</td>
                                 <td>{monthNames[g.month]} {g.year}</td>
                                 <td>{(g.count * 0.01).toFixed(2)} €</td>
                               </tr>
                             ));
                           } catch (error) {
                             console.error('Error processing message logs:', error);
                             return (
                               <tr>
                                 <td colSpan="4" style={{ textAlign: 'center', color: '#dc2626' }}>
                                   Virhe tietojen käsittelyssä
                                 </td>
                               </tr>
                             );
                           }
                         })()}
                       </tbody>
                     </table>
                   )}
                 </div>
               </div>
             )}

             {activeTab === 'segments' && (
               <div className="admin-section">
                 <h2>Segmentit</h2>
                 <div className="admin-table-container">
                   <table className="admin-table">
                     <thead>
                       <tr>
                         <th>Dia</th>
                         <th>Teksti</th>
                         <th>Tila</th>
                         <th>Luonut</th>
                         <th>Luotu</th>
                       </tr>
                     </thead>
                     <tbody>
                       {segments.map(segment => (
                         <tr key={segment.id}>
                           <td>{segment.slide_no || 'Ei diaa'}</td>
                           <td>{segment.text || 'Ei tekstiä'}</td>
                           <td>
                             <span className={`status-badge status-${segment.status?.toLowerCase()}`}>
                               {segment.status || 'Draft'}
                             </span>
                           </td>
                           <td>{segment.users?.contact_person || segment.users?.contact_email || 'Tuntematon'}</td>
                           <td>{new Date(segment.created_at).toLocaleDateString('fi-FI')}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}

             {activeTab === 'system' && (
               <div className="admin-section">
                 <h2>Järjestelmän tiedot</h2>
                 <div className="system-info">
                   <div className="info-card">
                     <h3>Käyttäjät</h3>
                     <p>Yhteensä: {stats.totalUsers || users.length}</p>
                     <p>Admineja: {stats.adminUsers || users.filter(u => u.role === 'admin').length}</p>
                     <p>Aktiivisia: {stats.activeUsers || 0}</p>
                   </div>
                   <div className="info-card">
                     <h3>Sisältö</h3>
                     <p>Yhteensä: {stats.totalContent || content.length}</p>
                     <p>Julkaistu: {stats.publishedContent || 0}</p>
                     <p>Segmenttejä: {stats.totalSegments || 0}</p>
                   </div>
                   <div className="info-card">
                     <h3>Kommunikaatio</h3>
                     <p>Puhelut: {stats.totalCalls || 0}</p>
                     <p>Vastattu: {stats.answeredCalls || 0}</p>
                     <p>Viestit: {stats.totalMessages || 0}</p>
                   </div>
                    <div className="info-card">
                      <h3>Järjestelmä</h3>
                      <p>Versio: {pkg.version}</p>
                      <p>Ympäristö: {process.env.NODE_ENV}</p>
                      <p>Supabase: Aktiivinen</p>
                    </div>
                 </div>
               </div>
             )}
          </>
        )}
      </div>
    </div>
  )
} 