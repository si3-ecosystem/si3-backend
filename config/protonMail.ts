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
  | "scholars";

// Email type to SMTP mapping
const EMAIL_TYPE_MAPPING: Record<EmailType, string> = {
  basic: "kara",
  guide: "guides",
  diversity: "kara",
  partner: "partners",
  scholars: "scholars",
};

// Sender email mapping
const SENDER_EMAIL_MAPPING: Record<EmailType, string> = {
  basic: "kara@si3.space",
  guide: "guides@si3.space",
  diversity: "kara@si3.space",
  partner: "partners@si3.space",
  scholars: "scholars@si3.space",
};

class EmailService {
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Get SMTP configuration dynamically (not cached at module load time)
   */
  private getSMTPConfigs(): Record<string, EmailConfig> {
    return {
      kara: {
        username: process.env.SMTP_USERNAME_KARA || "",
        token: process.env.SMTP_TOKEN_KARA || "",
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
    };
  }

  /**
   * Get SMTP configuration for email type
   */
  private getSMTPConfig(emailType: EmailType = "basic"): EmailConfig {
    // Get fresh config each time (not cached)
    const SMTP_CONFIGS = this.getSMTPConfigs();

    const smtpKey = EMAIL_TYPE_MAPPING[emailType] || "kara";
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
    this.validateEmailOptions(options);

    const transporter = this.createTransporter(options.emailType || "basic");

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

      const info = await transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        smtpUsed: EMAIL_TYPE_MAPPING[options.emailType || "basic"],
      };
    } catch (error) {
      throw new Error(`Email sending failed: ${(error as Error).message}`);
    } finally {
      transporter.close();
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
    return SENDER_EMAIL_MAPPING[emailType] || "kara@si3.space";
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
