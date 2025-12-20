#!/usr/bin/env node

// Test script for email service
import { getEmailService } from './lib/email/service.js'

async function testEmailService() {
  console.log('Testing email service configuration...')
  
  const emailService = getEmailService()
  
  console.log('Email service initialized')
  console.log('Is configured:', emailService.isConfigured())
  console.log('Default from:', emailService.getDefaultFrom())
  
  // Test Brevo provider
  try {
    const brevoProvider = emailService.getProvider('brevo')
    console.log('Brevo provider:', brevoProvider.name, 'configured:', brevoProvider.isConfigured())
  } catch (error) {
    console.error('Brevo provider error:', error.message)
  }
  
  // Test SMTP provider
  try {
    const smtpProvider = emailService.getProvider('smtp')
    console.log('SMTP provider:', smtpProvider.name, 'configured:', smtpProvider.isConfigured())
  } catch (error) {
    console.error('SMTP provider error:', error.message)
  }
  
  // Test sending a simple email (to console in dev mode)
  try {
    const result = await emailService.send({
      to: 'test@example.com',
      subject: 'Test Email from Brevo Configuration',
      text: 'This is a test email to verify Brevo configuration.',
      html: '<p>This is a test email to verify <strong>Brevo</strong> configuration.</p>'
    })
    
    console.log('Email send result:', result)
  } catch (error) {
    console.error('Email send error:', error.message)
  }
}

testEmailService().catch(console.error)