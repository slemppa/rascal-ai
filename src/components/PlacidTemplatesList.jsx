import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import PlacidEditor from './PlacidEditor'
import styles from './PlacidTemplatesList.module.css'

export default function PlacidTemplatesList() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState(null)

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
          .select('id, placid_id, variable_id')
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

  if (loading) {
      return <div className={styles.loading}>Ladataan malleja...</div>
  }

  if (templates.length === 0) {
      return null
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Omat mallit</h3>
      <div className={styles.grid}>
        {templates.map((template) => (
            <div key={template.id} className={styles.card}>
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

      {editingTemplate && (
          <PlacidEditor 
            placidId={editingTemplate} 
            onClose={() => setEditingTemplate(null)} 
          />
      )}
    </div>
  )
}

