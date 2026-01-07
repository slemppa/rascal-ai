import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './Toast.module.css'

const Toast = ({ id, message, type, onClose }) => {
  const { t } = useTranslation('common')
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
        aria-label={t('accessibility.closeNotification')}
      >
        ×
      </button>
    </div>
  )
}

export default Toast

