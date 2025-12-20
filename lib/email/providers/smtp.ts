/**
 * SMTP Email Provider
 * Implements email sending using SMTP protocol
 */
import type { EmailMessage, EmailResult, EmailProviderInterface } from '../types'


interface SMTPEmailData {
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html?: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

interface SMTPConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export class SMTPProvider implements EmailProviderInterface {
  name = 'smtp' as const
  private config: SMTPConfig

  constructor(config: SMTPConfig) {
    this.config = config
  }
  isConfigured(): boolean {
    return !!(this.config.host && this.config.auth.user && this.config.auth.pass)
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'SMTP is not configured',
        provider: this.name,
      }
    }

    const from = message.from ? `${message.from.name || ''} <${message.from.email}>` : this.config.auth.user
    const to = Array.isArray(message.to) ? message.to : [message.to]
    const cc = message.cc ? (Array.isArray(message.cc) ? message.cc : [message.cc]) : undefined
    const bcc = message.bcc ? (Array.isArray(message.bcc) ? message.bcc : [message.bcc]) : undefined

    const emailData: SMTPEmailData = {
      from,
      to,
      cc,
      bcc,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.type,
      })),
    }

    const result = await this.sendEmail(emailData)
    
    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      provider: this.name,
    }
  }
  async sendEmail(emailData: SMTPEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Using nodemailer for SMTP implementation
      const nodemailer = await import('nodemailer')

      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
        // TLS options
        tls: {
          rejectUnauthorized: false,
        },
      })

      // Verify SMTP connection
      await transporter.verify()

      const mailOptions = {
        from: emailData.from,
        to: emailData.to.join(', '),
        cc: emailData.cc?.join(', ') || undefined,
        bcc: emailData.bcc?.join(', ') || undefined,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        attachments: emailData.attachments?.map(attachment => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        })),
      }

      const result = await transporter.sendMail(mailOptions)

      // Close the connection
      transporter.close()

      return {
        success: true,
        messageId: result.messageId
      }

    } catch (error) {
      console.error('[SMTP] Email sending failed:', error)

      if (error instanceof Error) {
        // Handle specific SMTP errors
        if (error.message.includes('ECONNREFUSED')) {
          return {
            success: false,
            error: 'Connection refused - check SMTP host and port'
          }
        } else if (error.message.includes('EAUTH')) {
          return {
            success: false,
            error: 'Authentication failed - check username and password'
          }
        } else if (error.message.includes('EHOSTUNREACH')) {
          return {
            success: false,
            error: 'Host unreachable - check SMTP server address'
          }
        } else if (error.message.includes('ETIMEDOUT')) {
          return {
            success: false,
            error: 'Connection timeout - check network and firewall settings'
          }
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown SMTP error occurred'
      }
    }
  }

  /**
   * Test SMTP connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const nodemailer = await import('nodemailer')

      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.auth.user,
          pass: this.config.auth.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      })

      await transporter.verify()
      transporter.close()

      return { success: true }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMTP connection test failed'
      }
    }
  }

  /**
   * Get SMTP configuration details (excluding password)
   */
  getConfigInfo(): Omit<SMTPConfig, 'auth'> & { user: string } {
    return {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      user: this.config.auth.user,
    }
  }
}

/**
 * Validate SMTP configuration
 */
export function validateSMTPConfig(config: {
  host?: string
  port?: string
  user?: string
  pass?: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate host
  if (!config.host) {
    errors.push('SMTP host is required')
  } else if (!config.host.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
    errors.push('Invalid SMTP host format')
  }

  // Validate port
  if (!config.port) {
    errors.push('SMTP port is required')
  } else {
    const port = parseInt(config.port)
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push('SMTP port must be between 1 and 65535')
    }
  }

  // Validate user
  if (!config.user) {
    errors.push('SMTP username is required')
  }

  // Validate password
  if (!config.pass) {
    errors.push('SMTP password is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Create SMTP provider instance with validation
 */
export function createSMTPProvider(config: {
  host?: string
  port?: string
  user?: string
  pass?: string
}): SMTPProvider {
  const validation = validateSMTPConfig(config)

  if (!validation.valid) {
    throw new Error(`Invalid SMTP configuration: ${validation.errors.join(', ')}`)
  }

  // Determine if secure connection (typically port 465 for SSL, 587 for TLS)
  const port = parseInt(config.port!)
  const secure = port === 465 // SSL for port 465, TLS negotiation for 587

  return new SMTPProvider({
    host: config.host!,
    port: port,
    secure: secure,
    auth: {
      user: config.user!,
      pass: config.pass!
    }
  })
}

/**
 * Default SMTP ports for common providers
 */
export const SMTP_PORTS = {
  GMAIL: { ssl: 465, tls: 587 },
  OUTLOOK: { ssl: 587, tls: 587 },
  YAHOO: { ssl: 465, tls: 587 },
  SENDGRID: { ssl: 465, tls: 587 },
  AMAZON_SES: { ssl: 465, tls: 587, tls_starttls: 25, tls_implicit: 465 },
  MAILGUN: { ssl: 465, tls: 587 },
  POSTMARK: { ssl: 465, tls: 587 }
} as const