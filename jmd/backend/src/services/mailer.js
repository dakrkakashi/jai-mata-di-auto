/**
 * Mailer Service
 * Manages SMTP transporter and email notifications for customer leads and admin alerts.
 */

const nodemailer = require('nodemailer');
const { GMAIL_USER, GMAIL_PASS, SITE_URL } = require('../config');

function getTransporter() {
  if (!GMAIL_USER || !GMAIL_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });
}

/**
 * Send an email alert to the dealership owner when a new lead arrives
 */
async function sendLeadAlert(lead) {
  const transporter = getTransporter();
  if (!transporter) return false;

  const mailOptions = {
    from: `"Jai Mata Di Auto Website" <${GMAIL_USER}>`,
    to: GMAIL_USER,
    subject: `⚡ New Lead: ${lead.name || 'Website Visitor'} (${lead.model || 'General'})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2563eb; color: #fff; padding: 20px; text-align: center;">
          <h2 style="margin: 0;">New Customer Enquiry</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Jai Mata Di Auto Dealership</p>
        </div>
        <div style="padding: 24px; color: #1e293b;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; width: 140px;">Customer Name:</td><td>${lead.name || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Phone Number:</td><td><a href="tel:${lead.phone}">${lead.phone || 'N/A'}</a></td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Model of Interest:</td><td>${lead.model || 'General'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Pincode:</td><td>${lead.pincode || 'N/A'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Source Page:</td><td>${lead.source || 'Website'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Message / Notes:</td><td>${lead.message || 'No additional message.'}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Received At:</td><td>${new Date(lead.time || Date.now()).toLocaleString('en-IN')}</td></tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <a href="${SITE_URL}/admin/leads.html" style="background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Admin CRM</a>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (err) {
    console.warn('Failed to send lead alert email:', err.message);
    return false;
  }
}

/**
 * Test SMTP connection
 */
async function testSMTP() {
  const transporter = getTransporter();
  if (!transporter) throw new Error('SMTP credentials not configured (GMAIL_USER or GMAIL_PASS missing).');
  await transporter.verify();
  return true;
}

/**
 * Send custom email (e.g. from admin panel)
 */
async function sendCustomEmail({ to, subject, body, html }) {
  const transporter = getTransporter();
  if (!transporter) throw new Error('SMTP credentials not configured.');
  return transporter.sendMail({
    from: `"Jai Mata Di Auto" <${GMAIL_USER}>`,
    to,
    subject,
    text: body,
    html: html || `<p>${body}</p>`
  });
}

module.exports = {
  sendLeadAlert,
  testSMTP,
  sendCustomEmail
};
