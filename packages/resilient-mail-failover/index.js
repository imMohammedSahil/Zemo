const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const fs = require("fs");

/**
 * ResilientMailDispatcher: Cascading multi-provider email sender
 *
 * Tier 1: Brevo HTTP REST API (Port 443 - bypasses cloud egress port blocks)
 * Tier 2: Resend HTTP REST API (Port 443)
 * Tier 3: Nodemailer SMTP (Direct delivery for local development & SMTP clouds)
 * Tier 4: Developer Sandbox Simulation (Prevents crashes in dev mode)
 */
class ResilientMailer {
  constructor(config = {}) {
    this.config = {
      brevoApiKey: config.brevoApiKey || process.env.BREVO_API_KEY || "",
      resendApiKey: config.resendApiKey || process.env.RESEND_API_KEY || "",
      senderEmail: config.senderEmail || process.env.EMAIL_USER || process.env.SMTP_USER || "",
      senderName: config.senderName || "Notification",
      resendFromAddress: config.resendFromAddress || process.env.EMAIL_FROM || "onboarding@resend.dev",
      smtp: {
        host: config.smtpHost || process.env.SMTP_HOST,
        port: Number(config.smtpPort || process.env.SMTP_PORT) || 587,
        user: config.smtpUser || process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: config.smtpPass || process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    };

    this.resendClient = this.config.resendApiKey ? new Resend(this.config.resendApiKey) : null;
    this.smtpTransporter = this._initSmtpTransporter();
  }

  _initSmtpTransporter() {
    const { user, pass, host, port } = this.config.smtp;
    if (!user || !pass) return null;

    if (host && host !== "smtp.gmail.com") {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 8000
      });
    }

    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 8000
    });
  }

  /**
   * Universal dispatch with automatic cascading fallback
   * @param {Object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} options.html - HTML content
   * @param {string} [options.text] - Plain text fallback
   * @param {Array} [options.attachments] - Array of attachment objects
   */
  async send({ to, subject, html, text = "", attachments = [] }) {
    if (!to) {
      throw new Error("[ResilientMailer] 'to' recipient email is required.");
    }

    const errors = [];

    // --- TIER 1: Brevo HTTPS REST API (Port 443) ---
    if (this.config.brevoApiKey) {
      try {
        const brevoPayload = {
          sender: { name: this.config.senderName, email: this.config.senderEmail || "no-reply@app.com" },
          to: [{ email: to }],
          subject,
          htmlContent: html || text
        };

        if (attachments.length > 0) {
          brevoPayload.attachment = attachments.map((att) => {
            let base64 = "";
            if (att.content) {
              base64 = Buffer.isBuffer(att.content) ? att.content.toString("base64") : Buffer.from(att.content).toString("base64");
            } else if (att.path && fs.existsSync(att.path)) {
              base64 = fs.readFileSync(att.path).toString("base64");
            }
            return { name: att.filename, content: base64 };
          }).filter((a) => a.content);
        }

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "accept": "application/json",
            "api-key": this.config.brevoApiKey,
            "content-type": "application/json"
          },
          body: JSON.stringify(brevoPayload)
        });

        const data = await response.json();
        if (response.ok && (data.messageId || data.messageIds)) {
          return { provider: "brevo", success: true, messageId: data.messageId || data.messageIds[0] };
        }
        errors.push({ provider: "brevo", error: data.message || JSON.stringify(data) });
      } catch (err) {
        errors.push({ provider: "brevo", error: err.message });
      }
    }

    // --- TIER 2: Resend HTTPS REST API (Port 443) ---
    if (this.resendClient) {
      try {
        const resendAttachments = attachments
          .map((att) => ({
            filename: att.filename,
            content: att.content || (att.path && fs.existsSync(att.path) ? fs.readFileSync(att.path) : undefined)
          }))
          .filter((a) => a.content);

        const response = await this.resendClient.emails.send({
          from: this.config.resendFromAddress,
          to: [to],
          subject,
          html,
          text,
          attachments: resendAttachments.length > 0 ? resendAttachments : undefined
        });

        if (!response.error && response.data?.id) {
          return { provider: "resend", success: true, messageId: response.data.id };
        }
        errors.push({ provider: "resend", error: response.error?.message || response.error });
      } catch (err) {
        errors.push({ provider: "resend", error: err.message });
      }
    }

    // --- TIER 3: Nodemailer SMTP Fallback ---
    if (this.smtpTransporter) {
      try {
        const from = `"${this.config.senderName}" <${this.config.smtp.user}>`;
        const info = await this.smtpTransporter.sendMail({
          from,
          to,
          subject,
          html,
          text,
          attachments
        });
        return { provider: "smtp", success: true, messageId: info.messageId };
      } catch (err) {
        errors.push({ provider: "smtp", error: err.message });
      }
    }

    // --- TIER 4: Failover Exhausted ---
    const summary = errors.map((e) => `[${e.provider}]: ${e.error}`).join(" | ");
    throw new Error(`[ResilientMailer] All email delivery providers failed. Details: ${summary}`);
  }
}

module.exports = ResilientMailer;

