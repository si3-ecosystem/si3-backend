import nodemailer, { Transporter } from "nodemailer";

// Types
export interface EmailConfig {
  token: string;
  username: string;
}

export interface EmailOptions {
  cc?: string[];
  bcc?: string[];
  toName: string;
  toEmail: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  htmlContent: string;
  emailType?: EmailType;
}

export interface EmailResult {
  success: boolean;
  smtpUsed: string;
  response?: string;
  messageId: string;
}

export interface BulkEmailResult {
  email: string;
  error?: string;
  success: boolean;
  messageId?: string;
}

export type EmailType =
  | "basic"
  | "guide"
  | "partner"
  | "diversity"
  | "scholars"
  | "rsvp"
  | "events";

// Email type to SMTP mapping
const EMAIL_TYPE_MAPPING: Record<EmailType, string> = {
  basic: "members",
  guide: "guides",
  partner: "partners",
  scholars: "scholars",
  diversity: "members",
  rsvp: "events",
  events: "events",
};

// Sender email mapping
const SENDER_EMAIL_MAPPING: Record<EmailType, string> = {
  basic: "members@si3.space",
  guide: "guides@si3.space",
  partner: "partners@si3.space",
  scholars: "scholars@si3.space",
  diversity: "members@si3.space",
  rsvp: "events@si3.space",
  events: "events@si3.space",
};

class EmailService {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Get SMTP configuration dynamically (not cached at module load time)
   */
  private getSMTPConfigs(): Record<string, EmailConfig> {
    return {
      members: {
        username: process.env.SMTP_USERNAME_MEMBERS || "",
        token: process.env.SMTP_TOKEN_MEMBERS || "",
      },

      partners: {
        username: process.env.SMTP_USERNAME_PARTNERS || "",
        token: process.env.SMTP_TOKEN_PARTNERS || "",
      },

      guides: {
        username: process.env.SMTP_USERNAME_GUIDES || "",
        token: process.env.SMTP_TOKEN_GUIDES || "",
      },

      scholars: {
        username: process.env.SMTP_USERNAME_SCHOLARS || "",
        token: process.env.SMTP_TOKEN_SCHOLARS || "",
      },

      events: {
        username: process.env.SMTP_USERNAME_GUIDES || "",
        token: process.env.SMTP_TOKEN_GUIDES || "",
      },
    };
  }

  /**
   * Get SMTP configuration for email type
   */
  private getSMTPConfig(emailType: EmailType = "basic"): EmailConfig {
    // Get fresh config each time (not cached)
    const SMTP_CONFIGS = this.getSMTPConfigs();

    const smtpKey = EMAIL_TYPE_MAPPING[emailType] || "members";
    const config = SMTP_CONFIGS[smtpKey];

    if (!config.username || !config.token) {
      throw new Error(
        `Missing SMTP credentials for ${smtpKey}. Check environment variables. Username: ${!!config.username}, Token: ${!!config.token}`
      );
    }

    return config;
  }

  /**
   * Create nodemailer transporter
   */
  private createTransporter(emailType: EmailType): Transporter {
    const smtpConfig = this.getSMTPConfig(emailType);

    return nodemailer.createTransport({
      host: process.env.SMTP_SERVER || "smtp.protonmail.ch",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.token,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5,
    });
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    return this.emailRegex.test(email);
  }

  /**
   * Validate required email fields
   */
  private validateEmailOptions(options: EmailOptions): void {
    const required = [
      "senderName",
      "senderEmail",
      "toName",
      "toEmail",
      "subject",
      "htmlContent",
    ];
    const missing = required.filter(
      (field) => !options[field as keyof EmailOptions]
    );

    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(", ")}`);
    }

    if (!this.validateEmail(options.toEmail)) {
      throw new Error("Invalid recipient email format");
    }
  }

  /**
   * Send single email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const startTime = Date.now();
    const emailType = options.emailType || "basic";
    const smtpKey = EMAIL_TYPE_MAPPING[emailType];

    // Enhanced logging for debugging
    console.log(`[EMAIL DEBUG] Starting email send attempt:`, {
      emailType,
      smtpKey,
      to: options.toEmail,
      subject: options.subject,
      timestamp: new Date().toISOString()
    });

    this.validateEmailOptions(options);

    let transporter;
    try {
      transporter = this.createTransporter(emailType);
      console.log(`[EMAIL DEBUG] Transporter created successfully for ${emailType}`);
    } catch (error) {
      console.error(`[EMAIL DEBUG] Failed to create transporter for ${emailType}:`, error);
      throw error;
    }

    try {
      const mailOptions: any = {
        from: `"${options.senderName}" <${options.senderEmail}>`,
        to: `"${options.toName}" <${options.toEmail}>`,
        subject: options.subject,
        html: options.htmlContent,
      };

      // Add CC if provided
      if (options.cc && options.cc.length > 0) {
        mailOptions.cc = options.cc
          .filter((email) => this.validateEmail(email))
          .join(", ");
      }

      // Add BCC if provided
      if (options.bcc && options.bcc.length > 0) {
        mailOptions.bcc = options.bcc
          .filter((email) => this.validateEmail(email))
          .join(", ");
      }

      console.log(`[EMAIL DEBUG] Sending email with options:`, {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtmlContent: !!mailOptions.html,
        htmlContentLength: mailOptions.html?.length || 0,
        cc: mailOptions.cc,
        bcc: mailOptions.bcc
      });

      const info = await transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;

      console.log(`[EMAIL DEBUG] Email sent successfully:`, {
        messageId: info.messageId,
        response: info.response,
        duration: `${duration}ms`,
        smtpUsed: smtpKey
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        smtpUsed: smtpKey,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[EMAIL DEBUG] Email sending failed:`, {
        error: (error as Error).message,
        duration: `${duration}ms`,
        emailType,
        smtpKey,
        to: options.toEmail,
        subject: options.subject
      });
      throw new Error(`Email sending failed: ${(error as Error).message}`);
    } finally {
      if (transporter) {
        transporter.close();
        console.log(`[EMAIL DEBUG] Transporter closed for ${emailType}`);
      }
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    recipients: Array<{ email: string; name?: string }>,
    subject: string,
    htmlContent: string,
    emailType: EmailType = "basic",
    senderName: string = "SI<3>"
  ): Promise<{
    results: BulkEmailResult[];
    errors: BulkEmailResult[];
    summary: { total: number; sent: number; failed: number };
  }> {
    const results: BulkEmailResult[] = [];
    const errors: BulkEmailResult[] = [];

    const senderEmail = this.getSenderEmail(emailType);

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail({
          senderName,
          senderEmail,
          toName: recipient.name || "Recipient",
          toEmail: recipient.email,
          subject,
          htmlContent,
          emailType,
        });

        results.push({
          email: recipient.email,
          success: true,
          messageId: result.messageId,
        });
      } catch (error) {
        errors.push({
          email: recipient.email,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return {
      results,
      errors,
      summary: {
        total: recipients.length,
        sent: results.length,
        failed: errors.length,
      },
    };
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(emailType: EmailType = "basic"): Promise<boolean> {
    try {
      const transporter = this.createTransporter(emailType);
      await transporter.verify();

      transporter.close();

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get SMTP status for all configurations
   */
  getSMTPStatus(): Record<
    string,
    { hasUsername: boolean; hasToken: boolean; isConfigured: boolean }
  > {
    const status: Record<string, any> = {};
    const SMTP_CONFIGS = this.getSMTPConfigs(); // Get fresh config

    Object.keys(SMTP_CONFIGS).forEach((key) => {
      const config = SMTP_CONFIGS[key];
      status[key] = {
        hasUsername: !!config.username,
        hasToken: !!config.token,
        isConfigured: !!(config.username && config.token),
      };
    });

    return status;
  }

  /**
   * Get sender email for email type
   */
  getSenderEmail(emailType: EmailType): string {
    return SENDER_EMAIL_MAPPING[emailType] || "members@si3.space";
  }

  /**
   * Test all SMTP connections
   */
  async testAllConnections(): Promise<Record<EmailType, boolean>> {
    const results: Record<string, boolean> = {};
    const emailTypes: EmailType[] = [
      "basic",
      "guide",
      "partner",
      "diversity",
      "scholars",
    ];

    for (const type of emailTypes) {
      try {
        results[type] = await this.verifyConnection(type);
      } catch (error) {
        results[type] = false;
      }
    }

    return results as Record<EmailType, boolean>;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
