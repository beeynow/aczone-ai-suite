/**
 * Professional email templates with modern design
 */

interface BaseEmailParams {
  name: string;
}

interface VerificationEmailParams extends BaseEmailParams {
  verificationUrl: string;
  expirationHours: number;
}

interface WelcomeEmailParams extends BaseEmailParams {
  loginUrl: string;
  dashboardUrl: string;
}

interface PasswordResetEmailParams extends BaseEmailParams {
  resetUrl: string;
  expirationMinutes: number;
  supportEmail: string;
}

interface PasswordResetConfirmationParams extends BaseEmailParams {
  loginUrl: string;
  supportEmail: string;
}

interface TwoFactorEmailParams extends BaseEmailParams {
  code: string;
  expirationMinutes: number;
}

/**
 * Base email template with consistent styling
 */
const baseEmailTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tryinterview</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f7fa;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
    }
    .content p {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #555555;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      margin: 24px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 16px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      font-size: 14px;
      color: #666666;
    }
    .code-box {
      background-color: #f8f9fa;
      border: 2px dashed #667eea;
      padding: 20px;
      margin: 24px 0;
      border-radius: 8px;
      text-align: center;
    }
    .code {
      font-size: 32px;
      font-weight: 700;
      color: #667eea;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      margin: 8px 0;
      font-size: 14px;
      color: #6c757d;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    .social-links {
      margin: 20px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #6c757d;
      text-decoration: none;
      font-size: 14px;
    }
    .divider {
      height: 1px;
      background-color: #e9ecef;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .container {
        margin: 20px;
        border-radius: 8px;
      }
      .header {
        padding: 30px 20px;
      }
      .content {
        padding: 30px 20px;
      }
      .code {
        font-size: 24px;
        letter-spacing: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Tryinterview</h1>
      <p>Your Professional AI-Powered Platform</p>
    </div>
    ${content}
    <div class="footer">
      <p><strong>Tryinterview</strong></p>
      <p>Empowering your success with AI technology</p>
      <div class="divider"></div>
      <div class="social-links">
        <a href="#">Twitter</a>
        <a href="#">LinkedIn</a>
        <a href="#">GitHub</a>
      </div>
      <p style="font-size: 12px; color: #adb5bd; margin-top: 20px;">
        This email was sent to you by Tryinterview.<br>
        If you didn't request this, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Email verification template
 */
export const verificationEmailTemplate = (params: VerificationEmailParams): string => {
  const content = `
    <div class="content">
      <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Hi ${params.name}! 👋</h2>
      <p>Thank you for signing up with Tryinterview! We're excited to have you on board.</p>
      <p>To get started, please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${params.verificationUrl}" class="button">Verify Email Address</a>
      </div>

      <div class="info-box">
        <p><strong>⏰ Important:</strong> This verification link will expire in ${params.expirationHours} hours.</p>
      </div>

      <p style="font-size: 14px; color: #6c757d;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 13px; word-break: break-all; color: #667eea;">
        ${params.verificationUrl}
      </p>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6c757d;">
        If you didn't create an account with Tryinterview, please ignore this email.
      </p>
    </div>
  `;
  return baseEmailTemplate(content);
};

/**
 * Welcome email template
 */
export const welcomeEmailTemplate = (params: WelcomeEmailParams): string => {
  const content = `
    <div class="content">
      <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Welcome aboard, ${params.name}! 🎉</h2>
      <p>Your email has been verified successfully! You're now part of the Tryinterview community.</p>
      
      <p><strong>Here's what you can do now:</strong></p>
      <ul style="color: #555555; font-size: 16px; line-height: 1.8;">
        <li>🎯 Create and join AI-powered interviews</li>
        <li>📊 Track your progress with detailed analytics</li>
        <li>🏆 Earn achievements and certificates</li>
        <li>🤝 Collaborate in virtual meetings</li>
        <li>✨ Generate content with AI tools</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.dashboardUrl}" class="button">Go to Dashboard</a>
      </div>

      <div class="info-box">
        <p><strong>💡 Pro Tip:</strong> Complete your profile to unlock all features and earn bonus points!</p>
      </div>

      <div class="divider"></div>

      <p style="font-size: 14px; color: #6c757d;">
        Need help getting started? Check out our <a href="#" style="color: #667eea;">documentation</a> or contact our support team.
      </p>
    </div>
  `;
  return baseEmailTemplate(content);
};

/**
 * Password reset email template
 */
export const passwordResetEmailTemplate = (params: PasswordResetEmailParams): string => {
  const content = `
    <div class="content">
      <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Password Reset Request 🔐</h2>
      <p>Hi ${params.name},</p>
      <p>We received a request to reset your password for your Tryinterview account.</p>
      <p>Click the button below to create a new password:</p>
      
      <div style="text-align: center;">
        <a href="${params.resetUrl}" class="button">Reset Password</a>
      </div>

      <div class="info-box">
        <p><strong>⏰ Important:</strong> This link will expire in ${params.expirationMinutes} minutes for security reasons.</p>
      </div>

      <p style="font-size: 14px; color: #6c757d;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 13px; word-break: break-all; color: #667eea;">
        ${params.resetUrl}
      </p>

      <div class="divider"></div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and contact our support team at <a href="mailto:${params.supportEmail}" style="color: #856404;">${params.supportEmail}</a>
        </p>
      </div>
    </div>
  `;
  return baseEmailTemplate(content);
};

/**
 * Password reset confirmation template
 */
export const passwordResetConfirmationTemplate = (params: PasswordResetConfirmationParams): string => {
  const content = `
    <div class="content">
      <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Password Changed Successfully ✅</h2>
      <p>Hi ${params.name},</p>
      <p>Your password has been changed successfully. You can now log in with your new password.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.loginUrl}" class="button">Log In Now</a>
      </div>

      <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #0c5460; font-size: 14px;">
          <strong>🔒 Security Tips:</strong>
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #0c5460; font-size: 14px;">
          <li>Never share your password with anyone</li>
          <li>Use a unique password for each service</li>
          <li>Enable two-factor authentication for extra security</li>
        </ul>
      </div>

      <div class="divider"></div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>⚠️ Didn't change your password?</strong><br>
          If you didn't make this change, please contact our support team immediately at <a href="mailto:${params.supportEmail}" style="color: #856404;">${params.supportEmail}</a>
        </p>
      </div>
    </div>
  `;
  return baseEmailTemplate(content);
};

/**
 * Two-factor authentication code template
 */
export const twoFactorEmailTemplate = (params: TwoFactorEmailParams): string => {
  const content = `
    <div class="content">
      <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0;">Your Security Code 🔒</h2>
      <p>Hi ${params.name},</p>
      <p>Here is your two-factor authentication code:</p>
      
      <div class="code-box">
        <div class="code">${params.code}</div>
      </div>

      <div class="info-box">
        <p><strong>⏰ Expiration:</strong> This code will expire in ${params.expirationMinutes} minutes.</p>
      </div>

      <p style="font-size: 14px; color: #6c757d;">
        Enter this code in the application to complete your login.
      </p>

      <div class="divider"></div>

      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>⚠️ Security Notice:</strong> If you didn't request this code, someone may be trying to access your account. Please secure your account immediately.
        </p>
      </div>
    </div>
  `;
  return baseEmailTemplate(content);
};
