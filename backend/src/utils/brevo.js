import { env } from '../config/env.js';

/**
 * Send a transactional email via Brevo (Sendinblue) API.
 * https://developers.brevo.com/reference/sendtransacemail
 */
export async function sendBrevoEmail({ to, subject, html, text }) {
  if (!env.BREVO_API_KEY) {
    const err = new Error('BREVO_API_KEY is not configured on the server');
    err.statusCode = 500;
    throw err;
  }

  const senderEmail = env.BREVO_SENDER_EMAIL || 'noreply@afroluxo.com';
  const senderName = env.BREVO_SENDER_NAME || 'AFROLUXO';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text || undefined
    })
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Brevo email failed (${res.status}): ${body || res.statusText}`);
    err.statusCode = 502;
    throw err;
  }

  return res.json().catch(() => ({}));
}

export function passwordResetEmailHtml({ name, resetUrl }) {
  const safeName = name || 'there';
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4e4e7;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.2em;color:#71717a;font-weight:700;">AFROLUXO BY ASI</p>
          <h1 style="margin:0 0 16px;font-size:22px;color:#09090b;">Reset your password</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#3f3f46;">Hi ${safeName},</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#3f3f46;">
            We received a request to reset your password. Click the button below — this link expires in <strong>30 minutes</strong>.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${resetUrl}" style="display:inline-block;background:#09090b;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:14px;font-weight:700;">
              Reset password
            </a>
          </p>
          <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#71717a;">Or copy this link:</p>
          <p style="margin:0 0 24px;font-size:12px;word-break:break-all;color:#52525b;">${resetUrl}</p>
          <p style="margin:0;font-size:12px;color:#a1a1aa;">If you did not request this, you can ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
