import React from 'react'
import Button from '../Button'
import { useTranslation } from 'react-i18next'

export default function CallLogsTab({
  exportCallLogs,
  fetchCallLogs,
  loadingCallLogs,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  callTypeFilter,
  setCallTypeFilter,
  callTypes,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  handleSearch,
  clearFilters,
  callLogs,
  callLogsError,
  totalCount,
  sortField,
  sortDirection,
  handleSort,
  fetchLogDetail,
  formatDuration,
  updatingLogIds,
  handleUpdateCallType,
  handleCancelCall
}) {
  const { t } = useTranslation('common')

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
          {t('calls.tabs.logs')}
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="button" onClick={exportCallLogs} variant="secondary" style={{ padding: '8px 16px', fontSize: 14, background: '#10b981', color: '#fff' }}>
            {t('calls.logsTab.buttons.export')}
          </Button>
          <Button type="button" onClick={() => fetchCallLogs()} disabled={loadingCallLogs} variant="secondary" style={{ padding: '8px 16px', fontSize: 14, background: loadingCallLogs ? '#9ca3af' : '#3b82f6', color: '#fff' }}>
            {loadingCallLogs ? t('calls.logsTab.buttons.refreshing') : t('calls.logsTab.buttons.refresh')}
          </Button>
        </div>
      </div>

      {/* Filtterit */}
      <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 32 }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: '#374151' }}>
          {t('calls.logsTab.filters.title')}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              {t('calls.logsTab.filters.searchLabel')}
            </label>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('calls.logsTab.filters.searchPlaceholder')} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1f2937', background: '#fff' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              {t('calls.logsTab.filters.statusLabel')}
            </label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1f2937', background: '#fff' }}>
              <option value="">{t('calls.logsTab.filters.all')}</option>
              <option value="success">{t('calls.logsTab.filters.statusOptions.success')}</option>
              <option value="failed">{t('calls.logsTab.filters.statusOptions.failed')}</option>
              <option value="pending">{t('calls.logsTab.filters.statusOptions.pending')}</option>
              <option value="in_progress">{t('calls.logsTab.filters.statusOptions.inProgress')}</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              {t('calls.logsTab.filters.typeLabel')}
            </label>
            <select value={callTypeFilter} onChange={(e) => setCallTypeFilter(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1f2937', background: '#fff' }}>
              <option value="">{t('calls.logsTab.filters.all')}</option>
              <option value="successful">{t('calls.logsTab.filters.statusOptions.successful')}</option>
              {callTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              {t('calls.logsTab.filters.dateFrom')}
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1f2937', background: '#fff' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 500, color: '#374151' }}>
              {t('calls.logsTab.filters.dateTo')}
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, color: '#1f2937', background: '#fff' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={handleSearch} disabled={loadingCallLogs} style={{ fontSize: 14, fontWeight: 500, marginRight: 8 }}>
            {t('calls.logsTab.filters.searchButton')}
          </Button>
          <Button onClick={clearFilters} style={{ fontSize: 14, fontWeight: 500 }} variant="secondary">
            {t('calls.logsTab.filters.clearButton')}
          </Button>
        </div>
      </div>

      {/* Tilastot ja taulukko (lyhennetty: säilytetään nykyinen sisältö) */}
      {/* Tässä komponentissa toistetaan nykyinen tilasto- ja taulukkosisältö 1:1,
          mutta se on jaettu erilleen CallPanel.jsx:stä paremman ylläpidettävyyden vuoksi. */}
      {/* Jotta muutokset pysyvät minimaalisina, jätetään tilastot ja taulukko toistaiseksi CallPanel.jsx:ään.
          Seuraavassa iteraatiossa voidaan siirtää myös ne tähän komponenttiin. */}
    </div>
  )
}


