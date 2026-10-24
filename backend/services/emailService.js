const { Resend } = require("resend");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");


const LOGO_URL = process.env.EMAIL_LOGO_URL || "https://raw.githubusercontent.com/imMohammedSahil/Zemo/main/frontend/public/logo.png";

function getResendClient() {
  if (process.env.RESEND_API_KEY) {
    return new Resend(process.env.RESEND_API_KEY);
  }
  return null;
}

/**
 * Configure email transporter for local SMTP fallback
 */
function getTransporter() {
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_HOST !== "smtp.gmail.com") {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

/**
 * Universal email dispatcher: Resend HTTP API first (bypasses Render SMTP port blocks),
 * with Nodemailer SMTP fallback for local dev.
 */
async function deliverEmail({ to, defaultSenderName, subject, html, attachments = [] }) {
  const recipient = to || process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  if (!recipient) {
    console.warn(`[EmailService] No recipient provided for "${subject}". Simulating.`);
    return { success: true, simulated: true };
  }

  // 1. Prioritize Resend HTTP API (works 100% on Render Free tier over HTTPS)
  const resend = getResendClient();
  if (resend) {
    console.log(`[EmailService] Dispatching via Resend HTTP API to ${recipient}...`);
    try {
      let fromAddress = process.env.EMAIL_FROM || "Zemo <onboarding@resend.dev>";
      if (fromAddress.includes("Zemo Alerts") || fromAddress.includes("Zemo Wish Bell") || fromAddress.includes("Zemo Deals")) {
        fromAddress = fromAddress.replace(/Zemo (?:Alerts|Wish Bell|Deals)/, "Zemo");
      }
      const resendAttachments = attachments
        .map(att => ({
          filename: att.filename,
          content: att.content || (att.path && fs.existsSync(att.path) ? fs.readFileSync(att.path) : undefined)
        }))
        .filter(att => att.content);

      const response = await resend.emails.send({
        from: fromAddress,
        to: [recipient],
        subject,
        html,
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined
      });

      if (response.error) {
        console.error("[EmailService] Resend API error:", response.error);
        return { success: false, error: response.error.message };
      }

      console.log(`[EmailService] Delivered successfully via Resend to ${recipient}:`, response.data?.id);
      return { success: true, messageId: response.data?.id };
    } catch (err) {
      console.error("[EmailService] Resend HTTP call failed:", err.message);
    }
  }

  // 2. Fallback to Nodemailer SMTP
  const transporter = getTransporter();
  if (transporter) {
    console.log(`[EmailService] Dispatching via Nodemailer SMTP to ${recipient}...`);
    try {
      const from = `"${defaultSenderName || 'Zemo'}" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`;
      const info = await transporter.sendMail({
        from,
        to: recipient,
        subject,
        html,
        attachments
      });
      console.log(`[EmailService] Delivered successfully via SMTP to ${recipient}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error("[EmailService] SMTP sendMail failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  console.log(`[EmailService] Email simulated for ${recipient} ("${subject}"). Set RESEND_API_KEY to send real emails.`);
  return { success: true, simulated: true };
}

/**
 * Send warm feel-good email confirmation when a user makes a wish
 */
/**
 * Send warm feel-good email confirmation when a user makes a wish
 */
async function sendWishSetEmail({ to, productTitle, warmPhrase, targetPrice, currentPrice, mrp, productImage, productUrl, source }) {
  const recipient = to || process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  const transporter = getTransporter();

  const formattedTarget = Number(targetPrice).toLocaleString();
  const formattedCurrent = Number(currentPrice).toLocaleString();
  const savings = Math.max(0, Number(currentPrice) - Number(targetPrice));
  const formattedSavings = savings > 0 ? savings.toLocaleString() : null;

  const phraseToUse = warmPhrase || `Chasing ${productTitle} around the clock until it surrenders at ₹${formattedTarget}`;
  const storeLabel = source ? (source.charAt(0).toUpperCase() + source.slice(1)) : "Store";

  const htmlContent = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #060D09; width: 100% !important; min-width: 100%; margin: 0; padding: 32px 16px; table-layout: fixed;">
      <tr>
        <td align="center" style="background-color: #060D09; padding: 0;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: transparent; color: #EAE5D9; max-width: 580px; width: 100%; margin: auto; border: none; box-sizing: border-box;">
            
            <!-- Top Nav Bar: Logo on Left, Feel-Good Badge on Right -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; width: 100%;">
              <tr>
                <td align="left" valign="middle" style="padding: 0;">
                  <img src="${LOGO_URL}" alt="Zemo" width="56" height="56" style="display: block; width: 56px; height: 56px; object-fit: contain;" />
                </td>
                <td align="right" valign="middle" style="padding: 0;">
                  <span style="background: #0E2A1B; color: #CEFF00; font-family: monospace; font-size: 10px; font-weight: 800; padding: 6px 14px; border-radius: 999px; border: 1px solid #163E26; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                    Wish Bell Active • Ready to Chime
                  </span>
                </td>
              </tr>
            </table>

            <!-- Brand Header -->
            <div style="text-align: center; margin-bottom: 28px;">
              <h1 style="color: #F5F2EA; font-size: 26px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -0.5px; line-height: 1.25;">
                Your wish is safely locked in.
              </h1>
              <p style="color: #9EB0A3; font-size: 14px; line-height: 1.6; margin: 0; max-width: 440px; margin: auto;">
                Take a deep breath and relax—you deserve what makes you smile without checking tabs every hour. I&apos;ve got my eyes glued to this price tag for you.
              </p>
            </div>

            <!-- Feel-Good AI Phrase Banner -->
            <div style="background: linear-gradient(135deg, #0A1C12 0%, #07150D 100%); border: 1px solid #1E5C35; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px; text-align: center;">
              <p style="color: #CEFF00; font-size: 13px; font-weight: 700; margin: 0; font-family: monospace; line-height: 1.4;">
                ${phraseToUse}
              </p>
            </div>

            <!-- Product Showcase Card -->
            <div style="background: #08150D; border: 1px solid #163E26; border-radius: 20px; padding: 20px; margin-bottom: 24px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
                <tr>
                  ${productImage ? `
                    <td width="76" valign="middle" align="left" style="width: 76px; min-width: 76px; padding: 0 16px 0 0; vertical-align: middle;">
                      <div style="width: 72px; height: 72px; background: #060E08; border: 1px solid #143E26; border-radius: 14px; text-align: center; line-height: 72px; font-size: 0; box-sizing: border-box; padding: 6px;">
                        <img src="${productImage}" alt="${productTitle}" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; vertical-align: middle; display: inline-block; border-radius: 8px;" />
                      </div>
                    </td>
                  ` : ''}
                  <td valign="middle" align="left" style="vertical-align: middle; text-align: left; padding: 0;">
                    <div style="font-family: monospace; font-size: 11px; color: #6D8274; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; line-height: 1.2;">
                      TARGET LISTING &bull; ${storeLabel}
                    </div>
                    <h3 style="color: #F5F2EA; font-size: 18px; margin: 0; font-weight: 700; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      ${productTitle}
                    </h3>
                  </td>
                </tr>
              </table>

              <!-- Price Comparison Strip -->
              <div style="background: #061009; border: 1px solid #123320; border-radius: 14px; padding: 14px 18px;">
                <table style="width: 100%; border-collapse: collapse; font-family: monospace; font-size: 13px;">
                  <tr>
                    <td style="color: #9EB0A3; padding: 4px 0;">Current Store Price:</td>
                    <td style="text-align: right; color: #D2CEC4; font-weight: 600;">₹${formattedCurrent}</td>
                  </tr>
                  <tr>
                    <td style="color: #CEFF00; padding: 4px 0; font-weight: bold;">Your Happy Target:</td>
                    <td style="text-align: right; color: #CEFF00; font-weight: 900; font-size: 15px;">₹${formattedTarget}</td>
                  </tr>
                  ${formattedSavings ? `
                    <tr style="border-top: 1px dashed #143E26;">
                      <td style="color: #68D391; padding: 8px 0 4px 0; font-size: 12px; font-weight: bold;">Expected Savings:</td>
                      <td style="text-align: right; color: #68D391; font-weight: bold; font-size: 13px; padding-top: 4px;">₹${formattedSavings}</td>
                    </tr>
                  ` : ''}
                </table>
              </div>
            </div>

            <!-- Caring Message -->
            <div style="background: #07130A; border-left: 3px solid #CEFF00; border-radius: 4px 12px 12px 4px; padding: 14px 18px; margin-bottom: 26px;">
              <p style="color: #D8E6DB; font-size: 13px; line-height: 1.6; margin: 0;">
                Shopping for things you love should always feel exciting and never stressful. Zemo checks prices around the clock so you don't have to check tabs every day. The moment this price hits your target, I&apos;ll send a cheerful notification straight to your inbox so you can grab it at the best possible moment.
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="http://localhost:5173/#hero" style="background: #CEFF00; color: #000000; font-family: monospace; font-weight: 900; font-size: 13px; text-decoration: none; padding: 13px 28px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 20px rgba(206,255,0,0.35);">
                Step Inside Zemo →
              </a>
            </div>

            <!-- Warm Sign-off & Footer -->
            <div style="text-align: center; border-top: 1px solid #143E26; padding-top: 20px;">
              <p style="color: #EAE5D9; font-size: 13px; font-weight: 700; margin: 0 0 4px 0;">
                Warmly,<br/>Zemo
              </p>
              <p style="color: #6D8274; font-size: 11px; margin: 0; font-family: monospace;">
                Yours through every season • Sweet deals, good feels
              </p>
            </div>

          </div>
        </td>
      </tr>
    </table>
  `;

  return await deliverEmail({
    to: recipient,
    defaultSenderName: "Zemo",
    subject: `Your wish is safely locked in: Chasing ${productTitle} for you at ₹${formattedTarget}!`,
    html: htmlContent
  });
}

/**
 * Send price drop alert email when price meets target
 */
async function sendPriceDropEmail({ to, productTitle, newPrice, targetPrice, productUrl }) {
  const recipient = to || process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER;
  const formattedNew = Number(newPrice).toLocaleString();
  const formattedTarget = Number(targetPrice).toLocaleString();

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060D09; color: #EAE5D9; padding: 32px 24px; border-radius: 20px; max-width: 580px; margin: auto; border: 1px solid #CEFF00;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="background: #CEFF00; color: #000; font-family: monospace; font-size: 11px; font-weight: 900; padding: 6px 14px; border-radius: 999px; text-transform: uppercase;">
          Price Drop Alert
        </span>
        <h1 style="color: #CEFF00; font-size: 26px; font-weight: 900; margin: 16px 0 8px 0; letter-spacing: -0.5px;">
          Your wish just came true!
        </h1>
        <p style="color: #EAE5D9; font-size: 15px; margin: 0;">
          The price dropped down to <strong style="color: #CEFF00; font-size: 18px;">₹${formattedNew}</strong>!
        </p>
      </div>

      <div style="background: #0A160F; border: 1px solid #163E26; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #EAE5D9; font-size: 15px; margin: 0 0 10px 0; font-weight: 700;">
          ${productTitle}
        </h3>
        <p style="color: #A6A095; font-size: 12px; margin: 0; font-family: monospace;">
          Target Price: ₹${formattedTarget} • Dropped To: ₹${formattedNew}
        </p>
      </div>

      <div style="text-align: center;">
        <a href="${productUrl || '#'}" style="background: #CEFF00; color: #000; font-family: monospace; font-weight: 900; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block;">
          Claim Deal on Store Now →
        </a>
      </div>
    </div>
  `;

  return await deliverEmail({
    to: recipient,
    defaultSenderName: "Zemo",
    subject: `Price Drop Alert: ${productTitle.slice(0, 45)}... is now ₹${formattedNew}!`,
    html: htmlContent
  });
}

/**
 * Send welcome notification email when user enters their Gmail ID on landing page
 */
async function sendWelcomeEmail({ to }) {
  const recipient = to || process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER;

  const htmlContent = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #060D09; width: 100% !important; min-width: 100%; margin: 0; padding: 32px 16px; table-layout: fixed;">
      <tr>
        <td align="center" style="background-color: #060D09; padding: 0;">
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: transparent; color: #EAE5D9; max-width: 580px; width: 100%; margin: auto; border: none; box-sizing: border-box;">
            
            <!-- Top Nav Bar: Logo on Left, Feel-Good Badge on Right -->
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; width: 100%;">
              <tr>
                <td align="left" valign="middle" style="padding: 0;">
                  <img src="${LOGO_URL}" alt="Zemo" width="56" height="56" style="display: block; width: 56px; height: 56px; object-fit: contain;" />
                </td>
                <td align="right" valign="middle" style="padding: 0;">
                  <span style="background: #0E2A1B; color: #CEFF00; font-family: monospace; font-size: 10px; font-weight: 800; padding: 6px 14px; border-radius: 999px; border: 1px solid #163E26; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                    Connected with Care
                  </span>
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin-bottom: 28px;">
              <h1 style="color: #F5F2EA; font-size: 26px; font-weight: 900; margin: 0 0 8px 0; letter-spacing: -0.5px; line-height: 1.25;">
                Welcome to Zemo
              </h1>
              <p style="color: #9EB0A3; font-size: 14px; line-height: 1.6; margin: 0; max-width: 460px; margin: auto;">
                Your inbox (<strong style="color: #CEFF00;">${recipient}</strong>) is now tuned in for gentle price drop alerts.
              </p>
            </div>

            <div style="background: #08150D; border: 1px solid #163E26; border-radius: 20px; padding: 22px; margin-bottom: 24px;">
              <h3 style="color: #CEFF00; font-size: 15px; margin: 0 0 10px 0; font-weight: 700;">
                Watching while you rest
              </h3>
              <p style="color: #D2CEC4; font-size: 13px; line-height: 1.7; margin: 0 0 14px 0;">
                Whenever you drop a product link and set your dream target price, I&apos;ll quietly keep watch around the clock and notify you the moment savings strike.
              </p>
              <div style="border-top: 1px solid #143E26; padding-top: 12px; font-family: monospace; font-size: 12px; color: #7B8F82;">
                Zero spam • Instant price drop alerts • Smart deal tracking
              </div>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="http://localhost:5173/#hero" style="background: #CEFF00; color: #000; font-family: monospace; font-weight: 900; font-size: 13px; text-decoration: none; padding: 13px 28px; border-radius: 14px; display: inline-block; box-shadow: 0 4px 20px rgba(206,255,0,0.35);">
                Step Inside Zemo →
              </a>
            </div>

            <div style="text-align: center; border-top: 1px solid #143E26; padding-top: 20px;">
              <p style="color: #EAE5D9; font-size: 13px; font-weight: 700; margin: 0 0 4px 0;">
                Warmly,<br/>Zemo
              </p>
              <p style="color: #6D8274; font-size: 11px; margin: 0; font-family: monospace;">
                Yours through every season • Sweet deals, good feels
              </p>
            </div>

          </div>
        </td>
      </tr>
    </table>
  `;

  return await deliverEmail({
    to: recipient,
    defaultSenderName: "Zemo",
    subject: `Welcome to the family — Happy savings ahead!`,
    html: htmlContent
  });
}

module.exports = {
  sendWishSetEmail,
  sendPriceDropEmail,
  sendWelcomeEmail
};
