import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { generateEmailVerificationToken, generatePasswordResetToken } from '../utils/jwt.js';
import { 
  verificationEmailTemplate, 
  welcomeEmailTemplate, 
  passwordResetEmailTemplate,
  passwordResetConfirmationTemplate,
  twoFactorEmailTemplate 
} from '../templates/email.templates.js';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10, // Max 10 messages per second
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  /**
   * Verify SMTP connection
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info('✅ Email service connected successfully');
    } catch (error) {
      logger.error('❌ Email service connection failed:', error);
    }
  }

  /**
   * Send email
   */
  private async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      });

      logger.info(`Email sent: ${info.messageId}`, { to, subject });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Strip HTML tags for plain text version
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, userId: string, name?: string): Promise<void> {
    const token = generateEmailVerificationToken(userId, email);
    const verificationUrl = `${env.VERIFY_EMAIL_URL}?token=${token}`;

    const html = verificationEmailTemplate({
      name: name || email.split('@')[0],
      verificationUrl,
      expirationHours: 24,
    });

    await this.sendEmail(
      email,
      '✅ Verify Your Email - Tryinterview',
      html
    );

    logger.info(`Verification email sent to: ${email}`);
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name?: string): Promise<void> {
    const html = welcomeEmailTemplate({
      name: name || email.split('@')[0],
      loginUrl: env.FRONTEND_URL + '/auth',
      dashboardUrl: env.FRONTEND_URL + '/dashboard',
    });

    await this.sendEmail(
      email,
      '🎉 Welcome to Tryinterview!',
      html
    );

    logger.info(`Welcome email sent to: ${email}`);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, userId: string, name?: string): Promise<void> {
    const token = generatePasswordResetToken(userId, email);
    const resetUrl = `${env.RESET_PASSWORD_URL}?token=${token}`;

    const html = passwordResetEmailTemplate({
      name: name || email.split('@')[0],
      resetUrl,
      expirationMinutes: 60,
      supportEmail: env.SMTP_USER,
    });

    await this.sendEmail(
      email,
      '🔐 Reset Your Password - Tryinterview',
      html
    );

    logger.info(`Password reset email sent to: ${email}`);
  }

  /**
   * Send password reset confirmation email
   */
  async sendPasswordResetConfirmationEmail(email: string, name?: string): Promise<void> {
    const html = passwordResetConfirmationTemplate({
      name: name || email.split('@')[0],
      loginUrl: env.FRONTEND_URL + '/auth',
      supportEmail: env.SMTP_USER,
    });

    await this.sendEmail(
      email,
      '✅ Password Reset Successful - Tryinterview',
      html
    );

    logger.info(`Password reset confirmation sent to: ${email}`);
  }

  /**
   * Send two-factor authentication code
   */
  async sendTwoFactorCode(email: string, code: string, name?: string): Promise<void> {
    const html = twoFactorEmailTemplate({
      name: name || email.split('@')[0],
      code,
      expirationMinutes: 10,
    });

    await this.sendEmail(
      email,
      '🔒 Your Two-Factor Authentication Code',
      html
    );

    logger.info(`2FA code sent to: ${email}`);
  }

  /**
   * Send custom email
   */
  async sendCustomEmail(to: string, subject: string, html: string): Promise<void> {
    await this.sendEmail(to, subject, html);
  }

  /**
   * Send bulk emails (with rate limiting)
   */
  async sendBulkEmails(
    emails: Array<{ to: string; subject: string; html: string }>
  ): Promise<void> {
    const results = await Promise.allSettled(
      emails.map(({ to, subject, html }) => this.sendEmail(to, subject, html))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info(`Bulk email results: ${successful} successful, ${failed} failed`);
  }

  /**
   * Close transporter
   */
  async close(): Promise<void> {
    this.transporter.close();
    logger.info('Email service closed');
  }
}

export const emailService = new EmailService();
