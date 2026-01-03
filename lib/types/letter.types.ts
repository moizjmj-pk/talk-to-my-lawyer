/**
 * Type definitions for Letter-related entities
 * Centralized types reduce duplication and improve type safety across the app
 */

/**
 * Letter status enum - represents all possible states of a letter
 */
export type LetterStatus =
  | 'draft'
  | 'generating'
  | 'pending_review'
  | 'under_review'
  | 'approved'
  | 'completed'
  | 'rejected'
  | 'failed'

/**
 * Letter type enum - available letter templates
 */
export type LetterType =
  | 'Demand Letter'
  | 'Cease and Desist'
  | 'Legal Notice'
  | 'Consumer Complaint'
  | 'Employment Dispute'
  | 'Landlord-Tenant Issue'
  | 'Contract Dispute'
  | 'Other'

/**
 * Database letter entity
 */
export interface Letter {
  id: string
  user_id: string
  letter_type: LetterType | string | null
  title: string
  status: LetterStatus
  intake_data: Record<string, unknown> | null
  ai_draft_content: string | null
  final_content: string | null
  review_notes: string | null
  rejection_reason: string | null
  draft_metadata: Record<string, unknown> | null
  pdf_url: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Letter with joined user profile data
 */
export interface LetterWithProfile extends Letter {
  profile?: {
    full_name: string | null
    email: string | null
    company_name: string | null
  }
}

/**
 * Audit trail entry for letter actions
 */
export interface LetterAuditTrail {
  id: string
  letter_id: string
  action: string
  performed_by: string | null
  old_status: string | null
  new_status: string | null
  notes: string | null
  metadata: Record<string, any> | null
  created_at: string
}

/**
 * Letter generation request payload
 */
export interface LetterGenerationRequest {
  letterType: LetterType | string
  intakeData: Record<string, unknown>
}

/**
 * Letter generation response
 */
export interface LetterGenerationResponse {
  success: boolean
  letterId: string
  status: LetterStatus
  isFreeTrial?: boolean
  aiDraft?: string
}

/**
 * Letter update request
 */
export interface LetterUpdateRequest {
  title?: string
  content?: string
  reviewNotes?: string
  finalContent?: string
  rejectionReason?: string
}

/**
 * Draft save request
 */
export interface DraftSaveRequest {
  letterId?: string
  title?: string
  content?: string
  letterType?: LetterType | string
  metadata?: Record<string, unknown>
}

/**
 * Letter allowance check result
 */
export interface LetterAllowance {
  has_allowance: boolean
  remaining: number | null
}

/**
 * Admin action context for letter operations
 */
export interface AdminActionContext {
  adminId: string
  adminEmail?: string
  timestamp: string
}
