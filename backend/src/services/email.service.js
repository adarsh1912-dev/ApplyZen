import { env } from '../config/env.js';

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const link = (path, token) => `${env.appBaseUrl}${path}?token=${encodeURIComponent(token)}`;

async function send({ to, subject, text, html }) {
  if (env.emailProvider === 'console') {
    if (!env.isTest) {
      console.log(`[email] ${subject} -> ${to}\n${text}`);
    }
    return { provider: 'console' };
  }

  if (env.emailProvider === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.resendApiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: [to],
        subject,
        text,
        html,
      }),
    });
    if (!res.ok) throw new Error(`email provider status ${res.status}`);
    return { provider: 'resend' };
  }

  throw new Error(`unsupported email provider: ${env.emailProvider}`);
}

function htmlShell({ title, body }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#F7F5F0;color:#171916;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #DDD8CF;border-radius:12px;padding:32px;">
      <p style="margin:0 0 20px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#245743;">ApplyZen</p>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${escapeHtml(title)}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#686A64;">If you didn’t request this, you can safely ignore this email.</p>
    </div>
  </body>
</html>`;
}

export async function sendVerificationEmail({ to, name, token }) {
  const url = link('/verify-email', token);
  const greeting = name ? `Hi ${name},` : 'Hi,';
  return send({
    to,
    subject: 'Verify your ApplyZen email',
    text: `${greeting}\n\nVerify your email to finish creating your ApplyZen account:\n\n${url}\n\nThis link expires in ${env.emailVerificationTtlHours} hours.`,
    html: htmlShell({
      title: 'Verify your email',
      body: `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">${escapeHtml(greeting)}</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Verify your email to finish creating your ApplyZen account.</p>
        <p style="margin:0 0 20px;"><a href="${url}" style="display:inline-block;background:#245743;color:#FFFFFF;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:600;">Verify email</a></p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#686A64;">This link expires in ${env.emailVerificationTtlHours} hours.</p>`,
    }),
  });
}

export async function sendPasswordResetEmail({ to, name, token }) {
  const url = link('/reset-password', token);
  const greeting = name ? `Hi ${name},` : 'Hi,';
  return send({
    to,
    subject: 'Reset your ApplyZen password',
    text: `${greeting}\n\nUse this link to choose a new ApplyZen password:\n\n${url}\n\nThis link expires in ${env.passwordResetTtlMinutes} minutes.`,
    html: htmlShell({
      title: 'Reset your password',
      body: `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;">${escapeHtml(greeting)}</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Use the button below to choose a new password. Resetting it will sign you out on every device.</p>
        <p style="margin:0 0 20px;"><a href="${url}" style="display:inline-block;background:#245743;color:#FFFFFF;text-decoration:none;padding:12px 18px;border-radius:8px;font-size:14px;font-weight:600;">Reset password</a></p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#686A64;">This link expires in ${env.passwordResetTtlMinutes} minutes.</p>`,
    }),
  });
}
