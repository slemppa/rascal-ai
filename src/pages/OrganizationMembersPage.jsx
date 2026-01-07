// src/pages/OrganizationMembersPage.jsx
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import styles from './OrganizationMembersPage.module.css'

const OrganizationMembersPage = () => {
  const { t } = useTranslation('common')
  const { user, organization } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)

  useEffect(() => {
    console.log('OrganizationMembersPage - useEffect triggered:', {
      organization,
      role: organization?.role,
      hasOrganization: !!organization
    })
    if (organization && (organization.role === 'owner' || organization.role === 'admin')) {
      fetchMembers()
    }
  }, [organization])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setError('Ei kirjautumistietoja')
        return
      }

      const response = await axios.get('/api/organization/members', {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('Fetched members from API:', response.data.members)
      // Näytä jokaisen jäsenen rooli
      if (response.data.members && response.data.members.length > 0) {
        console.log('Members with roles:', response.data.members.map(m => ({ email: m.email, role: m.role, auth_user_id: m.auth_user_id })))
      }
      setMembers(response.data.members || [])
    } catch (e) {
      console.error('Error fetching members:', e)
      setError(e.response?.data?.error || 'Virhe jäsenten haussa')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return

    try {
      setInviting(true)
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setError('Ei kirjautumistietoja')
        return
      }

      await axios.post('/api/organization/invite', {
        email: inviteEmail,
        role: inviteRole
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      // Päivitä jäsenlista
      await fetchMembers()
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteForm(false)
    } catch (e) {
      console.error('Error inviting member:', e)
      // Näytä myös hint ja details jos saatavilla
      const errorData = e.response?.data || {}
      const errorMessage = errorData.error || 'Virhe käyttäjän kutsussa'
      const hint = errorData.hint ? `\n${errorData.hint}` : ''
      const details = errorData.details ? `\n${errorData.details}` : ''
      setError(`${errorMessage}${hint}${details}`)
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (authUserId, newRole) => {
    try {
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setError('Ei kirjautumistietoja')
        return
      }

      await axios.put('/api/organization/update-role', {
        auth_user_id: authUserId,
        role: newRole
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      // Päivitä jäsenlista
      await fetchMembers()
    } catch (e) {
      console.error('Error updating role:', e)
      setError(e.response?.data?.error || e.message || 'Virhe roolin päivityksessä')
    }
  }

  const handleRemoveMember = async (authUserId) => {
    if (!window.confirm('Haluatko varmasti poistaa tämän jäsenen organisaatiosta?')) {
      return
    }

    try {
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setError('Ei kirjautumistietoja')
        return
      }

      await axios.delete('/api/organization/remove-member', {
        params: {
          auth_user_id: authUserId
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      // Päivitä jäsenlista
      await fetchMembers()
    } catch (e) {
      console.error('Error removing member:', e)
      setError(e.response?.data?.error || e.message || 'Virhe jäsenen poistamisessa')
    }
  }

  const handleResendInvite = async (authUserId) => {
    try {
      setError(null)

      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) {
        setError('Ei kirjautumistietoja')
        return
      }

      await axios.post('/api/organization/resend-invite', {
        auth_user_id: authUserId
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      // Näytä onnistumisviesti
      alert('Kutsu lähetetty uudelleen!')
    } catch (e) {
      console.error('Error resending invite:', e)
      setError(e.response?.data?.error || e.message || 'Virhe kutsun lähettämisessä')
    }
  }

  // Tarkista oikeudet
  if (!organization || (organization.role !== 'owner' && organization.role !== 'admin')) {
    return (
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <h1>Organisaation hallinta</h1>
        </div>
        <div className={styles.card}>
          <div className={styles.errorMessage}>
            <h2>Ei oikeuksia</h2>
            <p>Sinulla ei ole oikeuksia tarkastella organisaation jäseniä.</p>
          </div>
        </div>
      </div>
    )
  }

  // Varmista että organization on olemassa ja rooli on asetettu
  const userRole = organization?.role
  const canInvite = userRole === 'owner' || userRole === 'admin'
  const canRemove = userRole === 'owner'
  const canUpdateRole = userRole === 'owner' || userRole === 'admin'
  
  // Debug: Tarkista organisaation rooli
  console.log('OrganizationMembersPage - Organization:', {
    organization,
    userRole,
    canUpdateRole,
    canInvite,
    canRemove,
    user: user?.id
  })

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1>Organisaation hallinta</h1>
        {canInvite && (
          <Button
            onClick={() => setShowInviteForm(!showInviteForm)}
            variant={showInviteForm ? 'secondary' : 'primary'}
          >
            {showInviteForm ? t('ui.buttons.cancel') : t('organizationMembers.inviteUser')}
          </Button>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      {showInviteForm && canInvite && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Kutsu uusi käyttäjä</h2>
          <form onSubmit={handleInvite} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Sähköposti</label>
              <input
                type="email"
                id="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="kayttaja@example.com"
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="role">Rooli</label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className={styles.select}
              >
                <option value="member">Jäsen</option>
                <option value="admin">Admin</option>
                {organization.role === 'owner' && (
                  <option value="owner">Omistaja</option>
                )}
              </select>
            </div>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary" disabled={inviting}>
                {inviting ? 'Kutsutaan...' : 'Kutsu'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteEmail('')
                  setInviteRole('member')
                }}
              >
                Peruuta
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Jäsenet</h2>
        {loading ? (
          <div className={styles.loading}>Ladataan...</div>
        ) : (
          <div className={styles.membersList}>
            {members.length === 0 ? (
              <p className={styles.emptyState}>Ei jäseniä</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.membersTable}>
                  <thead>
                    <tr>
                      <th>Sähköposti</th>
                      <th>Rooli</th>
                      <th>Liittynyt</th>
                      <th>Toiminnot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const authUser = member.auth_users
                      // Vertaile auth_user_id:tä suoraan, ei auth_users.id:ta
                      const isCurrentUser = member.auth_user_id === user?.id
                      // Käytetään roolia suoraan org_members taulusta
                      const memberRole = member.role || 'member'
                      const isOwner = memberRole === 'owner'
                      
                      // Owner-roolia ei voi muuttaa (kukaan ei voi vaihtaa owner-roolia)
                      // Muut roolit voi muuttaa jos:
                      // 1. Käyttäjällä on oikeudet (admin/owner) - tarkistetaan canUpdateRole
                      // 2. Ei ole oma käyttäjä - tarkistetaan !isCurrentUser
                      // 3. Jäsenen rooli EI ole owner - tarkistetaan !isOwner
                      const canChangeThisRole = Boolean(canUpdateRole && !isCurrentUser && !isOwner)
                      
                      // Debug logi - näytetään vain jos ongelma
                      if (!canChangeThisRole && canUpdateRole) {
                        console.log('Member role check (cannot change):', {
                          email: authUser?.email,
                          memberRole,
                          memberAuthUserId: member.auth_user_id,
                          currentUserId: user?.id,
                          isCurrentUser,
                          isOwner,
                          organizationRole: organization?.role,
                          canUpdateRole,
                          canChangeThisRole,
                          reason: isCurrentUser ? 'is current user' : isOwner ? 'is owner (cannot change owner role)' : 'unknown'
                        })
                      }
                      
                      return (
                        <tr key={member.auth_user_id}>
                          <td>{authUser?.email || 'Ei sähköpostia'}</td>
                          <td>
                            {canChangeThisRole ? (
                              <select
                                value={memberRole}
                                onChange={(e) => handleUpdateRole(member.auth_user_id, e.target.value)}
                                className={styles.roleSelect}
                              >
                                <option value="member">Jäsen</option>
                                <option value="admin">Admin</option>
                                {/* Owner-roolia ei voi valita select-kentästä */}
                              </select>
                            ) : (
                              <span className={`${styles.roleBadge} ${styles[`role${memberRole.charAt(0).toUpperCase() + memberRole.slice(1)}`]}`}>
                                {memberRole === 'owner' ? 'Omistaja' : 
                                 memberRole === 'admin' ? 'Admin' : 'Jäsen'}
                              </span>
                            )}
                          </td>
                          <td>{new Date(member.created_at).toLocaleDateString('fi-FI')}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {/* Lähetä kutsu uudelleen -nappi */}
                              {canInvite && !isCurrentUser && (
                                <Button
                                  variant="secondary"
                                  onClick={() => handleResendInvite(member.auth_user_id)}
                                  style={{ fontSize: '13px', padding: '6px 12px' }}
                                >
                                  📧 Lähetä kutsu
                                </Button>
                              )}
                              {/* Owner-roolia ei voi poistaa */}
                              {canRemove && !isCurrentUser && !isOwner && (
                                <Button
                                  variant="danger"
                                  onClick={() => handleRemoveMember(member.auth_user_id)}
                                >
                                  Poista
                                </Button>
                              )}
                              {isCurrentUser && <span className={styles.currentUserBadge}>Sinä</span>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrganizationMembersPage
