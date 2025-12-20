/**
 * Unit Tests for Coupon and Commission Business Logic
 * Tests for coupon validation, discount calculation, and commission tracking
 */

import { describe, it, expect } from '@jest/globals'

// Coupon validation
interface Coupon {
  code: string
  discount_percent: number
  is_active: boolean
  usage_count: number
  max_uses?: number | null
  expires_at?: string | null
  employee_id?: string | null
}

const validateCoupon = (coupon: Coupon | null, currentDate: Date = new Date()): {
  valid: boolean
  error?: string
} => {
  if (!coupon) {
    return { valid: false, error: 'Coupon not found' }
  }
  
  if (!coupon.is_active) {
    return { valid: false, error: 'Coupon is inactive' }
  }
  
  if (coupon.max_uses && coupon.usage_count >= coupon.max_uses) {
    return { valid: false, error: 'Coupon has reached maximum uses' }
  }
  
  if (coupon.expires_at && new Date(coupon.expires_at) < currentDate) {
    return { valid: false, error: 'Coupon has expired' }
  }
  
  return { valid: true }
}

// Discount calculation
const calculateDiscount = (originalPrice: number, discountPercent: number): {
  discount: number
  finalPrice: number
} => {
  const discount = Math.round(originalPrice * (discountPercent / 100) * 100) / 100
  const finalPrice = Math.round((originalPrice - discount) * 100) / 100
  
  return { discount, finalPrice }
}

// Commission calculation
const calculateCommission = (
  saleAmount: number,
  discountAmount: number,
  commissionRate: number = 10
): number => {
  const netSale = saleAmount - discountAmount
  const commission = Math.round(netSale * (commissionRate / 100) * 100) / 100
  return commission
}

// Coupon code generation
const generateCouponCode = (prefix: string = 'PROMO'): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = prefix
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Fraud detection score
const calculateFraudScore = (usageData: {
  usesInLastHour: number
  usesInLastDay: number
  uniqueUsersUsed: number
  sameIPUses: number
}): {
  score: number
  isSuspicious: boolean
  reasons: string[]
} => {
  let score = 0
  const reasons: string[] = []
  
  // More than 5 uses in last hour
  if (usageData.usesInLastHour > 5) {
    score += 30
    reasons.push('High usage rate in last hour')
  }
  
  // More than 20 uses in last day
  if (usageData.usesInLastDay > 20) {
    score += 20
    reasons.push('High daily usage')
  }
  
  // Same IP used multiple times
  if (usageData.sameIPUses > 3) {
    score += 25
    reasons.push('Multiple uses from same IP')
  }
  
  // Very few unique users for high usage
  if (usageData.usesInLastDay > 10 && usageData.uniqueUsersUsed < 3) {
    score += 25
    reasons.push('Few unique users for high usage')
  }
  
  return {
    score,
    isSuspicious: score >= 50,
    reasons
  }
}

describe('Coupon Validation', () => {
  it('should reject null coupon', () => {
    const result = validateCoupon(null)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Coupon not found')
  })

  it('should reject inactive coupon', () => {
    const coupon: Coupon = {
      code: 'TEST10',
      discount_percent: 10,
      is_active: false,
      usage_count: 0
    }
    const result = validateCoupon(coupon)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Coupon is inactive')
  })

  it('should reject coupon that exceeded max uses', () => {
    const coupon: Coupon = {
      code: 'TEST10',
      discount_percent: 10,
      is_active: true,
      usage_count: 10,
      max_uses: 10
    }
    const result = validateCoupon(coupon)
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Coupon has reached maximum uses')
  })

  it('should reject expired coupon', () => {
    const coupon: Coupon = {
      code: 'TEST10',
      discount_percent: 10,
      is_active: true,
      usage_count: 0,
      expires_at: '2020-01-01T00:00:00Z'
    }
    const result = validateCoupon(coupon, new Date('2025-01-01'))
    expect(result.valid).toBe(false)
    expect(result.error).toBe('Coupon has expired')
  })

  it('should accept valid coupon', () => {
    const coupon: Coupon = {
      code: 'TEST10',
      discount_percent: 10,
      is_active: true,
      usage_count: 5,
      max_uses: 100,
      expires_at: '2030-01-01T00:00:00Z'
    }
    const result = validateCoupon(coupon)
    expect(result.valid).toBe(true)
  })

  it('should accept coupon with no limits', () => {
    const coupon: Coupon = {
      code: 'UNLIMITED',
      discount_percent: 20,
      is_active: true,
      usage_count: 1000,
      max_uses: null,
      expires_at: null
    }
    const result = validateCoupon(coupon)
    expect(result.valid).toBe(true)
  })
})

describe('Discount Calculation', () => {
  it('should calculate 10% discount correctly', () => {
    const result = calculateDiscount(100, 10)
    expect(result.discount).toBe(10)
    expect(result.finalPrice).toBe(90)
  })

  it('should calculate 25% discount correctly', () => {
    const result = calculateDiscount(200, 25)
    expect(result.discount).toBe(50)
    expect(result.finalPrice).toBe(150)
  })

  it('should calculate 100% discount correctly', () => {
    const result = calculateDiscount(50, 100)
    expect(result.discount).toBe(50)
    expect(result.finalPrice).toBe(0)
  })

  it('should handle decimal prices', () => {
    const result = calculateDiscount(99.99, 15)
    expect(result.discount).toBeCloseTo(15, 0)
    expect(result.finalPrice).toBeCloseTo(85, 0)
  })

  it('should return 0 discount for 0%', () => {
    const result = calculateDiscount(100, 0)
    expect(result.discount).toBe(0)
    expect(result.finalPrice).toBe(100)
  })
})

describe('Commission Calculation', () => {
  it('should calculate 10% commission on net sale', () => {
    const commission = calculateCommission(100, 10, 10)
    expect(commission).toBe(9) // 10% of (100 - 10)
  })

  it('should calculate commission with no discount', () => {
    const commission = calculateCommission(100, 0, 10)
    expect(commission).toBe(10)
  })

  it('should calculate commission with custom rate', () => {
    const commission = calculateCommission(100, 0, 15)
    expect(commission).toBe(15)
  })

  it('should handle zero sale', () => {
    const commission = calculateCommission(0, 0, 10)
    expect(commission).toBe(0)
  })
})

describe('Coupon Code Generation', () => {
  it('should generate code with default prefix', () => {
    const code = generateCouponCode()
    expect(code).toMatch(/^PROMO[A-Z0-9]{6}$/)
  })

  it('should generate code with custom prefix', () => {
    const code = generateCouponCode('EMP')
    expect(code).toMatch(/^EMP[A-Z0-9]{6}$/)
  })

  it('should generate unique codes', () => {
    const codes = new Set()
    for (let i = 0; i < 100; i++) {
      codes.add(generateCouponCode())
    }
    // All codes should be unique
    expect(codes.size).toBe(100)
  })
})

describe('Fraud Detection', () => {
  it('should not flag normal usage', () => {
    const result = calculateFraudScore({
      usesInLastHour: 2,
      usesInLastDay: 5,
      uniqueUsersUsed: 5,
      sameIPUses: 1
    })
    expect(result.isSuspicious).toBe(false)
    expect(result.score).toBeLessThan(50)
  })

  it('should flag high hourly usage', () => {
    const result = calculateFraudScore({
      usesInLastHour: 10,
      usesInLastDay: 10,
      uniqueUsersUsed: 10,
      sameIPUses: 1
    })
    expect(result.reasons).toContain('High usage rate in last hour')
  })

  it('should flag same IP abuse', () => {
    const result = calculateFraudScore({
      usesInLastHour: 2,
      usesInLastDay: 5,
      uniqueUsersUsed: 5,
      sameIPUses: 5
    })
    expect(result.reasons).toContain('Multiple uses from same IP')
  })

  it('should flag suspicious patterns', () => {
    const result = calculateFraudScore({
      usesInLastHour: 10,
      usesInLastDay: 30,
      uniqueUsersUsed: 2,
      sameIPUses: 5
    })
    expect(result.isSuspicious).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(50)
  })
})
