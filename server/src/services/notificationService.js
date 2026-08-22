const https = require('https');

const EMAIL_SERVICE_PROVIDER = process.env.EMAIL_SERVICE_PROVIDER || 'MOCK';
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'SocietyCare <noreply@yourdomain.com>';

/**
 * Sends an email using the configured email provider.
 * Supports 'RESEND' and 'MOCK' out of the box.
 */
async function sendEmail({ to, subject, html }) {
  if (EMAIL_SERVICE_PROVIDER === 'MOCK' || !EMAIL_API_KEY) {
    console.log('\n============== MOCK EMAIL SENT ==============');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From:    ${EMAIL_FROM}`);
    console.log('---------------- Content ----------------');
    console.log(html.replace(/<[^>]*>/g, ' ').substring(0, 300) + '...');
    console.log('=============================================\n');
    return { success: true, mock: true };
  }

  if (EMAIL_SERVICE_PROVIDER.toUpperCase() === 'RESEND') {
    return sendViaResend({ to, subject, html });
  }

  // Generic fallback if not configured
  console.log(`Email Service provider ${EMAIL_SERVICE_PROVIDER} is unrecognized. Mocking instead.`);
  return { success: true, mock: true };
}

/**
 * Resend Email Integration using standard https request
 */
function sendViaResend({ to, subject, html }) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject: subject,
      html: html,
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EMAIL_API_KEY}`,
        'Content-Length': data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: JSON.parse(responseBody) });
        } else {
          reject(new Error(`Resend API returned status code ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Standard Email HTML Template wrapper with SocietyCare styling.
 */
function getEmailTemplate(title, bodyContent, ctaText = null, ctaUrl = null) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const buttonHtml = ctaText && ctaUrl 
    ? `
      <div style="margin: 32px 0; text-align: center;">
        <a href="${ctaUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.15);">
          ${ctaText}
        </a>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F6; color: #1F2937;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);">
          <!-- Header -->
          <tr>
            <td style="background-color: #4f46e5; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">SocietyCare</h1>
              <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">Society Maintenance, without the chaos.</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin-top: 0; color: #1f2937; font-size: 20px; font-weight: 700;">${title}</h2>
              <div style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-top: 16px;">
                ${bodyContent}
              </div>
              ${buttonHtml}
              <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 32px 0;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                This is an automated notification from SocietyCare RWA Dashboard. Please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

/**
 * Notify resident when their complaint status changes
 */
async function notifyComplaintStatusChange({ residentEmail, residentName, complaintNumber, category, status, note, complaintId }) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const ctaUrl = `${clientUrl}/complaints/${complaintId}`;
  
  const statusLabels = {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved'
  };

  const statusColors = {
    OPEN: '#6366f1',
    IN_PROGRESS: '#f59e0b',
    RESOLVED: '#10b981'
  };

  const title = `Complaint #${complaintNumber} Status Updated`;
  const bodyContent = `
    <p>Dear ${residentName},</p>
    <p>Your complaint <strong>#NF-${complaintNumber}</strong> for <strong>${category}</strong> has been updated.</p>
    <div style="background-color: #fafaf9; border-left: 4px solid ${statusColors[status] || '#cbd5e1'}; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; font-weight: 700; color: #4b5563;">New Status</p>
      <p style="margin: 0; font-size: 18px; font-weight: 700; color: ${statusColors[status] || '#1f2937'};">${statusLabels[status] || status}</p>
      
      ${note ? `
        <p style="margin: 12px 0 4px 0; font-size: 14px; text-transform: uppercase; font-weight: 700; color: #4b5563;">Update Note</p>
        <p style="margin: 0; font-style: italic; color: #1f2937;">"${note}"</p>
      ` : ''}
    </div>
    <p>You can track the complete history and details of this complaint at any time by clicking the button below.</p>
  `;

  try {
    await sendEmail({
      to: residentEmail,
      subject: `Your SocietyCare complaint #NF-${complaintNumber} was updated`,
      html: getEmailTemplate(title, bodyContent, 'View Complaint Timeline', ctaUrl)
    });
  } catch (error) {
    console.error(`Failed to send status update email for complaint #${complaintNumber}:`, error.message);
  }
}

/**
 * Notify resident when an important notice is posted
 */
async function notifyImportantNotice({ residentEmail, residentName, noticeTitle, noticeContent, noticeId }) {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const ctaUrl = `${clientUrl}/notices`;

  const title = `📌 Important Notice: ${noticeTitle}`;
  const bodyContent = `
    <p>Dear ${residentName},</p>
    <p>An important notice has been posted on the SocietyCare Notice Board:</p>
    <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 20px; margin: 20px 0; border-radius: 12px;">
      <h3 style="margin-top: 0; color: #b45309; font-size: 16px; font-weight: 700;">${noticeTitle}</h3>
      <p style="margin: 10px 0 0 0; color: #78350f; line-height: 1.5; white-space: pre-wrap;">${noticeContent}</p>
    </div>
    <p>Please review the notice board for further details.</p>
  `;

  try {
    await sendEmail({
      to: residentEmail,
      subject: `Important notice from your society: ${noticeTitle}`,
      html: getEmailTemplate(title, bodyContent, 'View Notice Board', ctaUrl)
    });
  } catch (error) {
    console.error(`Failed to send notice notification email to ${residentEmail}:`, error.message);
  }
}

module.exports = {
  sendEmail,
  notifyComplaintStatusChange,
  notifyImportantNotice,
};
