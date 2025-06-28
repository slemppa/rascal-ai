import React from 'react'

function checkPasswordStrength(password) {
  const lengthValid = password.length >= 8
  const hasLowercase = /[a-z]/.test(password)
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const passedChecks = [hasLowercase, hasUppercase, hasNumber, hasSpecial].filter(Boolean).length

  return {
    lengthValid,
    strength: lengthValid && passedChecks >= 3 ? 'strong' : 'weak',
    checks: {
      lengthValid,
      hasLowercase,
      hasUppercase,
      hasNumber,
      hasSpecial
    }
  }
}

const checklist = [
  { key: 'lengthValid', label: 'Vähintään 8 merkkiä' },
  { key: 'hasLowercase', label: 'Pieni kirjain (a-z)' },
  { key: 'hasUppercase', label: 'Iso kirjain (A-Z)' },
  { key: 'hasNumber', label: 'Numero (0-9)' },
  { key: 'hasSpecial', label: 'Erikoismerkki (!@#$%^&*)' }
]

export default function PasswordStrengthChecker({ password }) {
  const { strength, checks } = checkPasswordStrength(password)

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {checklist.map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', fontSize: 15, color: checks[item.key] ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
            <span style={{ marginRight: 8 }}>
              {checks[item.key] ? '✅' : '❌'}
            </span>
            {item.label}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontWeight: 700, color: strength === 'strong' ? '#16a34a' : '#dc2626', fontSize: 15 }}>
        {strength === 'strong' ? 'Vahva salasana' : 'Salasana ei täytä vaatimuksia'}
      </div>
    </div>
  )
} 