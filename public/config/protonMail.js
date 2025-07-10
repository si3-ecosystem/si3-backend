"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email type to SMTP mapping
const EMAIL_TYPE_MAPPING = {
    basic: "kara",
    guide: "guides",
    diversity: "kara",
    partner: "partners",
    scholars: "scholars",
};
// Sender email mapping
const SENDER_EMAIL_MAPPING = {
    basic: "kara@si3.space",
    guide: "guides@si3.space",
    partner: "partners@si3.space",
    diversity: "kara@si3.space",
    scholars: "scholars@si3.space",
};
class EmailService {
    constructor() {
        this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    }
    /**
     * Get SMTP configuration dynamically (not cached at module load time)
     */
    getSMTPConfigs() {
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
    getSMTPConfig(emailType = "basic") {
        // Get fresh config each time (not cached)
        const SMTP_CONFIGS = this.getSMTPConfigs();
        const smtpKey = EMAIL_TYPE_MAPPING[emailType] || "kara";
        const config = SMTP_CONFIGS[smtpKey];
        if (!config.username || !config.token) {
            throw new Error(`Missing SMTP credentials for ${smtpKey}. Check environment variables. Username: ${!!config.username}, Token: ${!!config.token}`);
        }
        return config;
    }
    /**
     * Create nodemailer transporter
     */
    createTransporter(emailType) {
        const smtpConfig = this.getSMTPConfig(emailType);
        return nodemailer_1.default.createTransport({
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
    validateEmail(email) {
        return this.emailRegex.test(email);
    }
    /**
     * Validate required email fields
     */
    validateEmailOptions(options) {
        const required = [
            "senderName",
            "senderEmail",
            "toName",
            "toEmail",
            "subject",
            "htmlContent",
        ];
        const missing = required.filter((field) => !options[field]);
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
    sendEmail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validateEmailOptions(options);
            const transporter = this.createTransporter(options.emailType || "basic");
            try {
                const mailOptions = {
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
                const info = yield transporter.sendMail(mailOptions);
                return {
                    success: true,
                    messageId: info.messageId,
                    response: info.response,
                    smtpUsed: EMAIL_TYPE_MAPPING[options.emailType || "basic"],
                };
            }
            catch (error) {
                throw new Error(`Email sending failed: ${error.message}`);
            }
            finally {
                transporter.close();
            }
        });
    }
    /**
     * Send bulk emails
     */
    sendBulkEmails(recipients_1, subject_1, htmlContent_1) {
        return __awaiter(this, arguments, void 0, function* (recipients, subject, htmlContent, emailType = "basic", senderName = "SI<3>") {
            const results = [];
            const errors = [];
            const senderEmail = this.getSenderEmail(emailType);
            for (const recipient of recipients) {
                try {
                    const result = yield this.sendEmail({
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
                }
                catch (error) {
                    errors.push({
                        email: recipient.email,
                        success: false,
                        error: error.message,
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
        });
    }
    /**
     * Verify SMTP connection
     */
    verifyConnection() {
        return __awaiter(this, arguments, void 0, function* (emailType = "basic") {
            try {
                const transporter = this.createTransporter(emailType);
                yield transporter.verify();
                transporter.close();
                return true;
            }
            catch (error) {
                return false;
            }
        });
    }
    /**
     * Get SMTP status for all configurations
     */
    getSMTPStatus() {
        const status = {};
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
    getSenderEmail(emailType) {
        return SENDER_EMAIL_MAPPING[emailType] || "kara@si3.space";
    }
    /**
     * Test all SMTP connections
     */
    testAllConnections() {
        return __awaiter(this, void 0, void 0, function* () {
            const results = {};
            const emailTypes = [
                "basic",
                "guide",
                "partner",
                "diversity",
                "scholars",
            ];
            for (const type of emailTypes) {
                try {
                    results[type] = yield this.verifyConnection(type);
                }
                catch (error) {
                    results[type] = false;
                }
            }
            return results;
        });
    }
}
// Export singleton instance
exports.emailService = new EmailService();
exports.default = exports.emailService;
