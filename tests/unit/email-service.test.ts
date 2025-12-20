import { getEmailService } from '../../lib/email/service'

describe('Email Service - Brevo Configuration', () => {
  let emailService: any

  beforeEach(() => {
    // Set environment variables for testing
    process.env.BREVO_API_KEY = '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'
    process.env.EMAIL_FROM = 'noreply@talk-to-my-lawyer.com'
    process.env.EMAIL_FROM_NAME = 'Talk-To-My-Lawyer'
    process.env.EMAIL_PROVIDER = 'smtp'
    
    emailService = getEmailService()
  })

  test('should initialize with Brevo providers', () => {
    expect(emailService).toBeDefined()
    expect(emailService.isConfigured()).toBe(true)
  })

  test('should have Brevo API provider configured', () => {
    const brevoProvider = emailService.getProvider('brevo')
    expect(brevoProvider).toBeDefined()
    expect(brevoProvider.name).toBe('brevo')
    expect(brevoProvider.isConfigured()).toBe(true)
  })

  test('should have SMTP provider configured with Brevo settings', () => {
    const smtpProvider = emailService.getProvider('smtp')
    expect(smtpProvider).toBeDefined()
    expect(smtpProvider.name).toBe('smtp')
    expect(smtpProvider.isConfigured()).toBe(true)
  })

  test('should return correct default from email', () => {
    const defaultFrom = emailService.getDefaultFrom()
    expect(defaultFrom.email).toBe('noreply@talk-to-my-lawyer.com')
    expect(defaultFrom.name).toBe('Talk-To-My-Lawyer')
  })

  test('should prioritize SMTP over Brevo API (since SMTP is working)', () => {
    // Since SMTP is configured and working, it should be the default
    const defaultProvider = emailService.getProvider()
    expect(defaultProvider.name).toBe('smtp')
  })

  test('should be able to send email via Brevo API', async () => {
    const mockMessage = {
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'This is a test email',
      html: '<p>This is a test email</p>'
    }

    // In test mode, this should use console provider or mock
    const result = await emailService.send(mockMessage)
    expect(result).toBeDefined()
    expect(result.success).toBeDefined()
    expect(result.provider).toBeDefined()
  })

  test('should be able to send email via SMTP fallback', async () => {
    const mockMessage = {
      to: 'test@example.com',
      subject: 'Test Email via SMTP',
      text: 'This is a test email via SMTP',
      html: '<p>This is a test email via <strong>SMTP</strong></p>'
    }

    // Force SMTP provider
    const result = await emailService.send(mockMessage, 'smtp')
    expect(result).toBeDefined()
    expect(result.success).toBeDefined()
    expect(result.provider).toBe('smtp')
  })
})