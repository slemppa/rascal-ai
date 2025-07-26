import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
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
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          contact_email,
          contact_person,
          role,
          company_id,
          webhook_url,
          created_at,
          auth_user_id,
          company_name,
          thread_id,
          vapi_number_id,
          vapi_assistant_id,
          vector_store_id,
          voice_id,
          assistant_id
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      throw error
    }
  }

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id,
          idea,
          type,
          status,
          created_at,
          user_id,
          users(contact_person, contact_email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContent(data || [])
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
      const { data, error } = await supabase
        .from('call_logs')
        .select(`
          id,
          customer_name,
          phone_number,
          summary,
          price,
          call_type,
          call_date,
          answered,
          duration,
          call_status,
          call_outcome,
          created_at,
          users(contact_person, contact_email)
        `)
        .order('call_date', { ascending: false })

      if (error) throw error
      setCallLogs(data || [])
    } catch (error) {
      throw error
    }
  }

  const loadMessageLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('message_logs')
        .select(`
          id,
          phone_number,
          message_text,
          message_type,
          direction,
          status,
          media_url,
          media_type,
          created_at,
          users(contact_person, contact_email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessageLogs(data || [])
    } catch (error) {
      throw error
    }
  }

  const loadSegments = async () => {
    try {
      const { data, error } = await supabase
        .from('segments')
        .select(`
          id,
          slide_no,
          text,
          media_urls,
          status,
          created_at,
          users(contact_person, contact_email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSegments(data || [])
    } catch (error) {
      throw error
    }
  }

  const loadSystemStats = async () => {
    try {
      // Lataa kaikki data samanaikaisesti tilastojen laskemista varten
      const [usersData, contentData, callLogsData, messageLogsData, segmentsData] = await Promise.all([
        supabase.from('users').select('role, status, created_at'),
        supabase.from('content').select('status, type, created_at'),
        supabase.from('call_logs').select('call_status, answered, created_at'),
        supabase.from('message_logs').select('status, message_type, created_at'),
        supabase.from('segments').select('status, created_at')
      ])

      const stats = {
        totalUsers: usersData.data?.length || 0,
        adminUsers: usersData.data?.filter(u => u.role === 'admin').length || 0,
        activeUsers: usersData.data?.filter(u => u.status === 'Active').length || 0,
        totalContent: contentData.data?.length || 0,
        publishedContent: contentData.data?.filter(c => c.status === 'Published').length || 0,
        totalCalls: callLogsData.data?.length || 0,
        answeredCalls: callLogsData.data?.filter(c => c.answered).length || 0,
        totalMessages: messageLogsData.data?.length || 0,
        totalSegments: segmentsData.data?.length || 0,
        recentActivity: {
          users: usersData.data?.slice(0, 5) || [],
          content: contentData.data?.slice(0, 5) || [],
          calls: callLogsData.data?.slice(0, 5) || []
        }
      }

      setStats(stats)
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
                 
                 <div className="admin-table-container">
                   <table className="admin-table">
                     <thead>
                       <tr>
                         <th>Nimi</th>
                         <th>Sähköposti</th>
                         <th>Rooli</th>
                         <th>Yritys</th>
                         <th>Rekisteröitynyt</th>
                         <th>Toiminnot</th>
                       </tr>
                     </thead>
                     <tbody>
                       {filteredUsers.map(user => (
                         <tr key={user.id}>
                           <td>{user.contact_person || 'Nimeä ei asetettu'}</td>
                           <td>{user.contact_email}</td>
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
                 {selectedUser && (
                   <div className="modal-overlay" onClick={closeModal}>
                     <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                       <div className="modal-header">
                         <h3>
                           Muokkaa teknisiä ID:tä - {selectedUser.contact_person}
                           {Object.keys(modalChanges).length > 0 && (
                             <span className="unsaved-changes"> *</span>
                           )}
                         </h3>
                         <button 
                           className="modal-close"
                           onClick={closeModal}
                         >
                           ×
                         </button>
                       </div>
                       <div className="modal-body">
                         <div className="tech-fields-grid">
                           <div className="tech-field">
                             <label>Webhook URL</label>
                             <input
                               type="text"
                               value={modalChanges.webhook_url !== undefined ? modalChanges.webhook_url : (selectedUser.webhook_url || '')}
                               onChange={(e) => updateModalField('webhook_url', e.target.value)}
                               placeholder="https://..."
                             />
                           </div>
                           <div className="tech-field">
                             <label>Thread ID</label>
                             <input
                               type="text"
                               value={modalChanges.thread_id !== undefined ? modalChanges.thread_id : (selectedUser.thread_id || '')}
                               onChange={(e) => updateModalField('thread_id', e.target.value)}
                               placeholder="thread_..."
                             />
                           </div>
                           <div className="tech-field">
                             <label>VAPI Number ID</label>
                             <input
                               type="text"
                               value={modalChanges.vapi_number_id !== undefined ? modalChanges.vapi_number_id : (selectedUser.vapi_number_id || '')}
                               onChange={(e) => updateModalField('vapi_number_id', e.target.value)}
                               placeholder="vapi_number_..."
                             />
                           </div>
                           <div className="tech-field">
                             <label>VAPI Assistant ID</label>
                             <input
                               type="text"
                               value={modalChanges.vapi_assistant_id !== undefined ? modalChanges.vapi_assistant_id : (selectedUser.vapi_assistant_id || '')}
                               onChange={(e) => updateModalField('vapi_assistant_id', e.target.value)}
                               placeholder="vapi_assistant_..."
                             />
                           </div>
                           <div className="tech-field">
                             <label>Vector Store ID</label>
                             <input
                               type="text"
                               value={modalChanges.vector_store_id !== undefined ? modalChanges.vector_store_id : (selectedUser.vector_store_id || '')}
                               onChange={(e) => updateModalField('vector_store_id', e.target.value)}
                               placeholder="vector_store_..."
                             />
                           </div>
                           <div className="tech-field">
                             <label>Voice ID</label>
                             <input
                               type="text"
                               value={modalChanges.voice_id !== undefined ? modalChanges.voice_id : (selectedUser.voice_id || '')}
                               onChange={(e) => updateModalField('voice_id', e.target.value)}
                               placeholder="voice_..."
                             />
                           </div>
                           <div className="tech-field">
                             <label>Assistant ID</label>
                             <input
                               type="text"
                               value={modalChanges.assistant_id !== undefined ? modalChanges.assistant_id : (selectedUser.assistant_id || '')}
                               onChange={(e) => updateModalField('assistant_id', e.target.value)}
                               placeholder="asst_..."
                             />
                           </div>
                         </div>
                       </div>
                       <div className="modal-footer">
                         <div className="modal-buttons">
                           <button 
                             className="admin-btn admin-btn-secondary"
                             onClick={closeModal}
                             disabled={isSaving}
                           >
                             Sulje
                           </button>
                           <button 
                             className="admin-btn"
                             onClick={saveModalChanges}
                             disabled={isSaving || Object.keys(modalChanges).length === 0}
                           >
                             {isSaving ? 'Tallennetaan...' : 'Tallenna'}
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
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
                         // Ryhmitellään messageLogs käyttäjä+kuukausi -tasoille
                         const monthNames = [
                           'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
                           'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
                         ];
                         const groups = {};
                         messageLogs.forEach(msg => {
                           const user = msg.users?.contact_person || msg.users?.contact_email || 'Tuntematon';
                           const date = new Date(msg.created_at);
                           const month = date.getMonth();
                           const year = date.getFullYear();
                           const key = `${user}__${year}-${month}`;
                           if (!groups[key]) {
                             groups[key] = { user, year, month, count: 0 };
                           }
                           groups[key].count++;
                         });
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
                       })()}
                     </tbody>
                   </table>
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
                     <p>Versio: 1.0.0</p>
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