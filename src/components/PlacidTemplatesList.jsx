import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import PlacidEditor from './PlacidEditor'
import styles from './PlacidTemplatesList.module.css'

export default function PlacidTemplatesList() {
  const { user } = useAuth()
  const toast = useToast()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [creating, setCreating] = useState(false)

  // Tarkista onko käyttäjä admin (systemRole === 'admin' tai company_id === 1)
  const isAdmin = user?.systemRole === 'admin' || user?.systemRole === 'superadmin' || user?.company_id === 1

  // Näytä vain admin-käyttäjille
  if (!isAdmin) {
    return null
  }

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const orgId = await getUserOrgId(user.id)
        if (!orgId) return

        // Hae kaikki rivit variables-taulusta jossa on placid_id
        const { data, error } = await supabase
          .from('variables')
          .select('id, placid_id, variable_id, thumbnail_url')
          .eq('user_id', orgId)
          .not('placid_id', 'is', null)

        if (error) {
            console.error('Error fetching templates:', error)
        } else {
            // Suodatetaan tyhjät pois varmuuden vuoksi
            const validTemplates = data.filter(t => t.placid_id && t.placid_id.trim() !== '')
            setTemplates(validTemplates)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [user])

  const handleCreateTemplate = async () => {
    if (!user?.id) return

    try {
      setCreating(true)
      
      // Hae session token
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !sessionData.session?.access_token) {
        throw new Error('Sessio vanhentunut. Kirjaudu uudelleen.')
      }
      
      const response = await axios.post('/api/placid/create-template', {
        templateData: {}
      }, {
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        toast.success('Mallin luonti aloitettu! Päivitä sivu hetken kuluttua.')
        // Voit myös päivittää listan automaattisesti
        // fetchTemplates()
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Mallin luonti epäonnistui: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
      return <div className={styles.loading}>Ladataan malleja...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Omat mallit</h3>
        <button 
          onClick={handleCreateTemplate}
          disabled={creating}
          className={styles.createButton}
        >
          {creating ? 'Luodaan...' : 'Luo pohja'}
        </button>
      </div>
      
      {templates.length === 0 ? (
        <div className={styles.emptyState}>
          Ei vielä malleja. Luo ensimmäinen malli yllä olevasta napista.
        </div>
      ) : (
      <div className={styles.grid}>
        {templates.map((template) => (
            <div key={template.id} className={styles.card}>
                {template.thumbnail_url && (
                  <div className={styles.thumbnailWrapper}>
                    <img 
                      src={template.thumbnail_url} 
                      alt={template.variable_id || 'Template'} 
                      className={styles.thumbnail}
                    />
                  </div>
                )}
                <div className={styles.cardContent}>
                    <div className={styles.templateName}>{template.variable_id || 'Nimetön malli'}</div>
                    <div className={styles.templateId}>ID: {template.placid_id}</div>
                </div>
                <button 
                    onClick={() => setEditingTemplate(template.placid_id)}
                    className={styles.editButton}
                >
                    Muokkaa
                </button>
            </div>
        ))}
      </div>
      )}

      {editingTemplate && (
          <PlacidEditor 
            placidId={editingTemplate} 
            onClose={() => setEditingTemplate(null)} 
          />
      )}
    </div>
  )
}

