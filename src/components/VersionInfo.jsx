import React from 'react'
import packageJson from '../../package.json'
import './VersionInfo.css'

export default function VersionInfo({ style = {} }) {
  const version = packageJson.version
  const buildTime = new Date().toLocaleDateString('fi-FI')
  
  return (
    <div className="version-info" style={style}>
      v{version} • Build {buildTime}
    </div>
  )
} 