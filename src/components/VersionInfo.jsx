import React from 'react'
import packageJson from '../../package.json'

export default function VersionInfo({ style = {} }) {
  const version = packageJson.version
  const buildTime = new Date().toLocaleDateString('fi-FI')
  
  return (
    <div style={{
      fontSize: '12px',
      color: '#6b7280',
      textAlign: 'center',
      padding: '8px',
      ...style
    }}>
      v{version} • Build {buildTime}
    </div>
  )
} 