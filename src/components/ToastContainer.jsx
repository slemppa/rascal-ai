import React from 'react'
import { useToast } from '../contexts/ToastContext'
import Toast from './Toast'
import styles from './ToastContainer.module.css'

const ToastContainer = () => {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={removeToast}
        />
      ))}
    </div>
  )
}

export default ToastContainer

