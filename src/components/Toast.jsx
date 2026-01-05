import React, { useEffect, useState } from 'react'
import styles from './Toast.module.css'

const Toast = ({ id, message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300) // Match animation duration
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <div 
      className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exit : ''}`}
      role="alert"
    >
      <div className={styles.icon}>
        {getIcon()}
      </div>
      <div className={styles.message}>
        {message}
      </div>
      <button 
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Sulje ilmoitus"
      >
        ×
      </button>
    </div>
  )
}

export default Toast

