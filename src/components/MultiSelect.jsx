import React, { useState, useRef, useEffect } from 'react'
import './MultiSelect.css'

export default function MultiSelect({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Select...',
  label 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue]
    onChange(newValue)
  }

  const selectedLabels = value.map(v => options.find(o => o.value === v)?.label || v).join(', ')

  return (
    <div className="multiselect-wrapper" ref={dropdownRef}>
      {label && <label className="multiselect-label">{label}</label>}
      <div 
        className={`multiselect ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="multiselect-value">
          {value.length > 0 ? (
            <span>{selectedLabels || placeholder}</span>
          ) : (
            <span className="multiselect-placeholder">{placeholder}</span>
          )}
        </div>
        <span className="multiselect-arrow">▾</span>
      </div>
      {isOpen && (
        <div className="multiselect-dropdown">
          {options.length === 0 ? (
            <div className="multiselect-option">No options available</div>
          ) : (
            options.map(option => (
              <label key={option.value} className="multiselect-option">
                <input
                  type="checkbox"
                  checked={value.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}

