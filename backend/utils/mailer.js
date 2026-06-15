/**
 * mailer.js — Email utility using Brevo (Sendinblue) HTTP API
 *
 * Why Brevo instead of Resend or SMTP?
 * - Render blocks all outbound SMTP ports (25, 465, 587)
 * - Resend free plan restricts recipients to your own email (requires domain verification)
 * - Brevo free plan: 300 emails/day, send to ANY address, no domain verification needed
 *
 * Setup:
 *   1. Sign up free at https://brevo.com
 *   2. Go to Settings → SMTP & API → API Keys → Generate a new API key
 *   3. Add BREVO_API_KEY to your Render environment variables
 */

/**
 * Send an email via Brevo Transactional Email HTTP API.
 * Uses built-in fetch (Node 18+) — no extra packages needed.
 *
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html    - HTML body content
 */
async function sendEmail(to, subject, html) {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
        throw new Error('BREVO_API_KEY environment variable is not set');
    }

    const senderName  = process.env.EMAIL_SENDER_NAME  || 'BlockPay';
    const senderEmail = process.env.EMAIL_SENDER_EMAIL || 'blockpay.auth@gmail.com';

    const payload = {
        sender:   { name: senderName, email: senderEmail },
        to:       [{ email: to }],
        subject,
        htmlContent: html,
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method:  'POST',
        headers: {
            'accept':       'application/json',
            'api-key':      apiKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('❌ Brevo error:', data);
        throw new Error(data.message || `Brevo API error: ${response.status}`);
    }

    console.log('📧 Email sent via Brevo:', data.messageId);
    return data;
}

// Log readiness on startup
if (process.env.BREVO_API_KEY) {
    console.log('✅ Brevo email client ready');
} else {
    console.warn('⚠️  BREVO_API_KEY is not set — emails will fail');
}

module.exports = { sendEmail };
