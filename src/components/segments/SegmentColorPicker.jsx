import React from 'react'

const COLORS = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#8b5cf6','#ec4899','#111827']

export default function SegmentColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Valitse väri ${c}`}
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            background: c,
            border: value === c ? '3px solid #111827' : '2px solid #fff',
            boxShadow: '0 0 0 1px #e5e7eb'
          }}
        />
      ))}
    </div>
  )
}


