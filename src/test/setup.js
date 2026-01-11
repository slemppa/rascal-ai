import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Puhdista renderöidyt komponentit jokaisen testin jälkeen
afterEach(() => {
  cleanup()
})

