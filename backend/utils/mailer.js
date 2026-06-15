/**
 * mailer.js — Email utility using Resend HTTP API
 *
 * Why Resend instead of nodemailer + SMTP?
 * Render (and many cloud hosts) block outbound SMTP ports (25, 465, 587).
 * Resend communicates over HTTPS so it is never blocked.
 *
 * Setup:
 *   1. Sign up free at https://resend.com
 *   2. Create an API key
 *   3. Add RESEND_API_KEY to your Render environment variables
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// Log readiness on startup
if (process.env.RESEND_API_KEY) {
    console.log('✅ Resend email client ready');
} else {
    console.warn('⚠️  RESEND_API_KEY is not set — emails will fail');
}

/**
 * Send an email via Resend HTTP API.
 * @param {string} to      - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html    - HTML body content
 */
async function sendEmail(to, subject, html) {
    const fromAddress = process.env.EMAIL_FROM || 'BlockPay <onboarding@resend.dev>';

    const { data, error } = await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
    });

    if (error) {
        console.error('❌ Resend error:', error);
        throw new Error(error.message || 'Failed to send email');
    }

    console.log('📧 Email sent via Resend:', data.id);
    return data;
}

module.exports = { sendEmail };
