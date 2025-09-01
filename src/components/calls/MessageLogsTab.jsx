import React from 'react'
import Button from '../Button'
import { useTranslation } from 'react-i18next'

export default function MessageLogsTab({
  fetchMessageLogs,
  loadingMessageLogs,
  messageLogsError,
  messageLogs
}) {
  const { t, i18n } = useTranslation('common')

  const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-US'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      padding: 32,
      width: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
          {t('calls.tabs.messages')}
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button
            type="button"
            onClick={() => fetchMessageLogs()}
            disabled={loadingMessageLogs}
            variant="secondary"
            style={{ padding: '8px 16px', fontSize: 14, background: loadingMessageLogs ? '#9ca3af' : '#3b82f6', color: '#fff' }}
          >
            {loadingMessageLogs ? t('calls.messagesTab.buttons.refreshing') : t('calls.messagesTab.buttons.refresh')}
          </Button>
        </div>
      </div>

      {messageLogsError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, marginBottom: 24, color: '#dc2626' }}>
          {messageLogsError}
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#374151' }}>
            {t('calls.messagesTab.history.title')}
          </h3>
          {messageLogs.length > 0 && (
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              {t('calls.messagesTab.history.showingCount', { count: messageLogs.length })}
            </div>
          )}
        </div>

        {loadingMessageLogs ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
            {t('calls.messagesTab.loading')}
          </div>
        ) : messageLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
            {t('calls.messagesTab.empty')}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginBottom: 24 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f3f4f6', color: '#374151' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{t('calls.messagesTab.table.phone')}</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{t('calls.messagesTab.table.type')}</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{t('calls.messagesTab.table.direction')}</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{t('calls.messagesTab.table.status')}</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{t('calls.messagesTab.table.aiText')}</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{t('calls.messagesTab.table.customerText')}</th>
                  <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600 }}>{t('calls.messagesTab.table.date')}</th>
                </tr>
              </thead>
              <tbody>
                {messageLogs.map((log, index) => (
                  <tr
                    key={log.id || index}
                    style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{ padding: '8px', fontWeight: 500, color: '#1f2937' }}>{log.phone_number || '-'}</td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        background: log.message_type === 'sms' ? '#dbeafe' : 
                                  log.message_type === 'whatsapp' ? '#dcfce7' : 
                                  log.message_type === 'email' ? '#fef3c7' : '#f3f4f6',
                        color: log.message_type === 'sms' ? '#1d4ed8' : 
                               log.message_type === 'whatsapp' ? '#166534' : 
                               log.message_type === 'email' ? '#92400e' : '#6b7280'
                      }}>
                        {log.message_type === 'sms' ? 'SMS' : log.message_type === 'whatsapp' ? 'WhatsApp' : log.message_type === 'email' ? 'Email' : log.message_type}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        background: log.direction === 'outbound' ? '#dbeafe' : '#fef3c7',
                        color: log.direction === 'outbound' ? '#1d4ed8' : '#92400e'
                      }}>
                        {log.direction === 'outbound' ? t('calls.messagesTab.direction.outbound') : t('calls.messagesTab.direction.inbound')}
                      </span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        background: log.status === 'sent' ? '#dcfce7' : 
                                  log.status === 'delivered' ? '#dbeafe' : 
                                  log.status === 'read' ? '#fef3c7' : 
                                  log.status === 'failed' ? '#fef2f2' : '#f3f4f6',
                        color: log.status === 'sent' ? '#166534' : 
                               log.status === 'delivered' ? '#1d4ed8' : 
                               log.status === 'read' ? '#92400e' : 
                               log.status === 'failed' ? '#dc2626' : '#6b7280',
                        minWidth: 60
                      }}>
                        {log.status === 'sent' ? t('calls.messagesTab.status.sent') : 
                         log.status === 'delivered' ? t('calls.messagesTab.status.delivered') : 
                         log.status === 'read' ? t('calls.messagesTab.status.read') : 
                         log.status === 'failed' ? t('calls.messagesTab.status.failed') : 
                         log.status === 'pending' ? t('calls.messagesTab.status.pending') : log.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px', color: '#1f2937', fontSize: 13 }}>
                      {log.ai_text ? (log.ai_text.length > 50 ? log.ai_text.substring(0, 50) + '...' : log.ai_text) : '-'}
                    </td>
                    <td style={{ padding: '8px', color: '#1f2937', fontSize: 13 }}>
                      {log.customer_text ? (log.customer_text.length > 50 ? log.customer_text.substring(0, 50) + '...' : log.customer_text) : '-'}
                    </td>
                    <td style={{ padding: '8px', color: '#1f2937' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleDateString(locale) + ' ' + new Date(log.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


