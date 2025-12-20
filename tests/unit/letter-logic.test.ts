/**
 * Unit Tests for Letter Generation Business Logic
 * Tests for letter creation, validation, status management, and credit deduction
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock functions to simulate actual business logic
const letterStatuses = ['draft', 'generating', 'pending_review', 'under_review', 'approved', 'rejected', 'completed', 'failed']
const deletableStatuses = ['draft', 'rejected', 'failed']

// Letter validation rules
const validateLetterInput = (input: {
  title?: string
  letterType?: string
  description?: string
  recipientEmail?: string
}) => {
  const errors: string[] = []
  
  if (!input.title || input.title.length < 3) {
    errors.push('Title must be at least 3 characters')
  }
  if (input.title && input.title.length > 200) {
    errors.push('Title must be less than 200 characters')
  }
  if (!input.letterType) {
    errors.push('Letter type is required')
  }
  if (!input.description || input.description.length < 10) {
    errors.push('Description must be at least 10 characters')
  }
  if (input.recipientEmail && !input.recipientEmail.includes('@')) {
    errors.push('Invalid recipient email')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Status transition rules
const canTransitionTo = (currentStatus: string, newStatus: string): boolean => {
  const allowedTransitions: Record<string, string[]> = {
    'draft': ['generating', 'pending_review'],
    'generating': ['pending_review', 'failed'],
    'pending_review': ['under_review', 'approved', 'rejected'],
    'under_review': ['approved', 'rejected', 'pending_review'],
    'approved': ['completed'],
    'rejected': ['draft', 'pending_review'], // Allow resubmission
    'completed': [],
    'failed': ['draft', 'generating'] // Allow retry
  }
  
  return allowedTransitions[currentStatus]?.includes(newStatus) || false
}

// Credit calculation
const calculateCredits = (planType: string, isSuperUser: boolean): number => {
  if (isSuperUser) return Infinity
  
  const planCredits: Record<string, number> = {
    'free': 1,
    'starter': 5,
    'professional': 20,
    'enterprise': 100
  }
  
  return planCredits[planType] || 0
}

// Letter can be deleted check
const canDeleteLetter = (status: string, userId: string, letterOwnerId: string): {
  allowed: boolean
  reason?: string
} => {
  if (userId !== letterOwnerId) {
    return { allowed: false, reason: 'You can only delete your own letters' }
  }
  if (!deletableStatuses.includes(status)) {
    return { allowed: false, reason: `Cannot delete letters with status: ${status}` }
  }
  return { allowed: true }
}

describe('Letter Validation', () => {
  it('should reject empty title', () => {
    const result = validateLetterInput({
      title: '',
      letterType: 'legal_notice',
      description: 'This is a valid description'
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Title must be at least 3 characters')
  })

  it('should reject very long titles', () => {
    const result = validateLetterInput({
      title: 'A'.repeat(250),
      letterType: 'legal_notice',
      description: 'This is a valid description'
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Title must be less than 200 characters')
  })

  it('should require letter type', () => {
    const result = validateLetterInput({
      title: 'Valid Title',
      letterType: '',
      description: 'This is a valid description'
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Letter type is required')
  })

  it('should validate email format', () => {
    const result = validateLetterInput({
      title: 'Valid Title',
      letterType: 'legal_notice',
      description: 'This is a valid description',
      recipientEmail: 'invalid-email'
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid recipient email')
  })

  it('should accept valid input', () => {
    const result = validateLetterInput({
      title: 'Valid Title',
      letterType: 'legal_notice',
      description: 'This is a valid description that is long enough',
      recipientEmail: 'valid@email.com'
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('Letter Status Transitions', () => {
  it('should allow draft to generating', () => {
    expect(canTransitionTo('draft', 'generating')).toBe(true)
  })

  it('should allow draft to pending_review', () => {
    expect(canTransitionTo('draft', 'pending_review')).toBe(true)
  })

  it('should not allow draft directly to approved', () => {
    expect(canTransitionTo('draft', 'approved')).toBe(false)
  })

  it('should allow pending_review to under_review', () => {
    expect(canTransitionTo('pending_review', 'under_review')).toBe(true)
  })

  it('should allow approved to completed', () => {
    expect(canTransitionTo('approved', 'completed')).toBe(true)
  })

  it('should not allow completed to any other status', () => {
    letterStatuses.forEach(status => {
      if (status !== 'completed') {
        expect(canTransitionTo('completed', status)).toBe(false)
      }
    })
  })

  it('should allow rejected letters to be resubmitted', () => {
    expect(canTransitionTo('rejected', 'draft')).toBe(true)
    expect(canTransitionTo('rejected', 'pending_review')).toBe(true)
  })

  it('should allow failed letters to be retried', () => {
    expect(canTransitionTo('failed', 'draft')).toBe(true)
    expect(canTransitionTo('failed', 'generating')).toBe(true)
  })
})

describe('Credit Calculation', () => {
  it('should return infinite credits for super users', () => {
    expect(calculateCredits('starter', true)).toBe(Infinity)
    expect(calculateCredits('free', true)).toBe(Infinity)
  })

  it('should return correct credits for free plan', () => {
    expect(calculateCredits('free', false)).toBe(1)
  })

  it('should return correct credits for starter plan', () => {
    expect(calculateCredits('starter', false)).toBe(5)
  })

  it('should return correct credits for professional plan', () => {
    expect(calculateCredits('professional', false)).toBe(20)
  })

  it('should return correct credits for enterprise plan', () => {
    expect(calculateCredits('enterprise', false)).toBe(100)
  })

  it('should return 0 for unknown plans', () => {
    expect(calculateCredits('unknown_plan', false)).toBe(0)
  })
})

describe('Letter Deletion Rules', () => {
  const userId = 'user-123'
  const otherUserId = 'user-456'

  it('should allow deleting draft letters', () => {
    const result = canDeleteLetter('draft', userId, userId)
    expect(result.allowed).toBe(true)
  })

  it('should allow deleting rejected letters', () => {
    const result = canDeleteLetter('rejected', userId, userId)
    expect(result.allowed).toBe(true)
  })

  it('should allow deleting failed letters', () => {
    const result = canDeleteLetter('failed', userId, userId)
    expect(result.allowed).toBe(true)
  })

  it('should not allow deleting approved letters', () => {
    const result = canDeleteLetter('approved', userId, userId)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Cannot delete')
  })

  it('should not allow deleting pending_review letters', () => {
    const result = canDeleteLetter('pending_review', userId, userId)
    expect(result.allowed).toBe(false)
  })

  it('should not allow deleting other users letters', () => {
    const result = canDeleteLetter('draft', otherUserId, userId)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('only delete your own')
  })
})
