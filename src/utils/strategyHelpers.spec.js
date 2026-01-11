import { describe, it, expect } from 'vitest'
import {
  findStrategyByMonthAndYear,
  findNextMonthStrategy,
  calculateMonthlyLimit,
  ENGLISH_MONTH_NAMES,
  FINNISH_MONTH_NAMES
} from './strategyHelpers'

describe('calculateMonthlyLimit', () => {
  it('should return 30 for free subscription', () => {
    expect(calculateMonthlyLimit('free')).toBe(30)
    expect(calculateMonthlyLimit('FREE')).toBe(30)
    expect(calculateMonthlyLimit(null)).toBe(30)
    expect(calculateMonthlyLimit(undefined)).toBe(30)
  })

  it('should return 100 for pro subscription', () => {
    expect(calculateMonthlyLimit('pro')).toBe(100)
    expect(calculateMonthlyLimit('PRO')).toBe(100)
  })

  it('should return 999999 for enterprise subscription', () => {
    expect(calculateMonthlyLimit('enterprise')).toBe(999999)
    expect(calculateMonthlyLimit('ENTERPRISE')).toBe(999999)
  })
})

describe('findStrategyByMonthAndYear', () => {
  const createStrategy = (id, month, targetMonth) => ({
    id,
    month,
    target_month: targetMonth
  })

  it('should find strategy by target_month date', () => {
    const strategies = [
      createStrategy(1, 'January 2024', '2024-01-15T00:00:00Z'),
      createStrategy(2, 'February 2024', '2024-02-15T00:00:00Z')
    ]
    
    const found = findStrategyByMonthAndYear(strategies, 0, 2024) // January 2024
    
    expect(found).not.toBeNull()
    expect(found.id).toBe(1)
  })

  it('should find strategy by month name (English)', () => {
    const strategies = [
      createStrategy(1, 'January 2024', null),
      createStrategy(2, 'February 2024', null)
    ]
    
    const found = findStrategyByMonthAndYear(strategies, 0, 2024) // January 2024
    
    expect(found).not.toBeNull()
    expect(found.id).toBe(1)
  })

  it('should find strategy by month name (Finnish)', () => {
    const strategies = [
      createStrategy(1, 'tammikuu 2024', null),
      createStrategy(2, 'helmikuu 2024', null)
    ]
    
    const found = findStrategyByMonthAndYear(strategies, 0, 2024) // January 2024
    
    expect(found).not.toBeNull()
    expect(found.id).toBe(1)
  })

  it('should return null if no strategy matches', () => {
    const strategies = [
      createStrategy(1, 'February 2024', null),
      createStrategy(2, 'March 2024', null)
    ]
    
    const found = findStrategyByMonthAndYear(strategies, 0, 2024) // January 2024
    
    expect(found).toBeNull()
  })

  it('should return null for empty strategies array', () => {
    const found = findStrategyByMonthAndYear([], 0, 2024)
    expect(found).toBeNull()
  })

  it('should return null for null strategies', () => {
    const found = findStrategyByMonthAndYear(null, 0, 2024)
    expect(found).toBeNull()
  })

  it('should prioritize target_month over month name', () => {
    const strategies = [
      createStrategy(1, 'February 2024', '2024-01-15T00:00:00Z'), // target_month is January
      createStrategy(2, 'January 2024', null)
    ]
    
    const found = findStrategyByMonthAndYear(strategies, 0, 2024) // January 2024
    
    expect(found).not.toBeNull()
    expect(found.id).toBe(1) // Should find by target_month, not month name
  })
})

describe('findNextMonthStrategy', () => {
  const createStrategy = (id, month) => ({ id, month })

  it('should find next month strategy with English month name and year', () => {
    const now = new Date('2024-01-15')
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthIndex = nextMonth.getMonth()
    const nextYear = nextMonth.getFullYear()

    const strategies = [
      createStrategy(1, 'January 2024'),
      createStrategy(2, `February ${nextYear}`),
      createStrategy(3, 'March 2024')
    ]
    
    const found = findNextMonthStrategy(strategies, nextMonthIndex, nextYear)
    
    expect(found).not.toBeNull()
    expect(found.id).toBe(2)
  })

  it('should find next month strategy with Finnish month name and year', () => {
    const now = new Date('2024-01-15')
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const nextMonthIndex = nextMonth.getMonth()
    const nextYear = nextMonth.getFullYear()

    const strategies = [
      createStrategy(1, 'tammikuu 2024'),
      createStrategy(2, `helmikuu ${nextYear}`),
      createStrategy(3, 'maaliskuu 2024')
    ]
    
    const found = findNextMonthStrategy(strategies, nextMonthIndex, nextYear)
    
    expect(found).not.toBeNull()
    expect(found.id).toBe(2)
  })

  it('should require both month and year match', () => {
    const strategies = [
      createStrategy(1, 'February 2024'),
      createStrategy(2, 'February 2025'), // Wrong year
      createStrategy(3, 'March 2024') // Wrong month
    ]
    
    const found = findNextMonthStrategy(strategies, 1, 2024) // February 2024
    
    expect(found).not.toBeNull()
    expect(found.id).toBe(1)
  })

  it('should return null if no strategy matches', () => {
    const strategies = [
      createStrategy(1, 'January 2024'),
      createStrategy(2, 'March 2024')
    ]
    
    const found = findNextMonthStrategy(strategies, 1, 2024) // February 2024
    
    expect(found).toBeNull()
  })

  it('should return null for empty strategies array', () => {
    const found = findNextMonthStrategy([], 1, 2024)
    expect(found).toBeNull()
  })

  it('should return null for strategies without month field', () => {
    const strategies = [
      { id: 1 }, // No month field
      { id: 2, month: null }
    ]
    
    const found = findNextMonthStrategy(strategies, 1, 2024)
    expect(found).toBeNull()
  })
})

