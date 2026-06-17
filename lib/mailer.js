import 'server-only';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';

/*
  Email service abstraction.
  - If RESEND_API_KEY is set, sends via Resend (https://resend.com).
  - Otherwise, logs to console AND writes the message to ./data/mail/*.txt
    so you can read what would have been sent in development.
  - All sends are recorded in the email_log table.
*/

const FROM = process.env.MAIL_FROM || 'WebCodeShop <hello@webcodeshop.dev>';
const RESEND_KEY = process.env.RESEND_API_KEY;
const MAIL_DIR = path.join(process.cwd(), 'data', 'mail');

async function sendViaResend({ to, subject, html, text }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error('Resend error: ' + res.status);
  return await res.json();
}

function logToFile({ to, subject, html, text, template }) {
  if (!fs.existsSync(MAIL_DIR)) fs.mkdirSync(MAIL_DIR, { recursive: true });
  const fn = new Date().toISOString().replace(/[:.]/g, '-') + '_' + (template || 'mail') + '.txt';
  const body = `To: ${to}\nSubject: ${subject}\nFrom: ${FROM}\n\n${text || html}`;
  fs.writeFileSync(path.join(MAIL_DIR, fn), body, 'utf8');
  console.log('[mailer:dev]', subject, '->', to, '(saved to', fn + ')');
}

export async function sendMail({ to, subject, html, text, template }) {
  const provider = RESEND_KEY ? 'resend' : 'console';
  try {
    if (RESEND_KEY) await sendViaResend({ to, subject, html, text });
    else logToFile({ to, subject, html, text, template });
    db().prepare('INSERT INTO email_log (to_addr,subject,template,provider) VALUES (?,?,?,?)').run(to, subject, template || null, provider);
  } catch (e) {
    console.error('[mailer] failed:', e.message);
    db().prepare('INSERT INTO email_log (to_addr,subject,template,provider) VALUES (?,?,?,?)').run(to, subject, template || null, 'failed');
  }
}

// ====== Templates ======
function layout(content) {
  return `<!doctype html><html><body style="font-family:Inter,system-ui,sans-serif;background:#fbfbfd;margin:0;padding:32px 16px;color:#0a1733;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6eaf2;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0b1f4d,#1e64ff);padding:24px;color:#fff;">
      <h1 style="margin:0;font-size:22px;letter-spacing:-0.02em;">WebCodeShop</h1>
    </div>
    <div style="padding:28px;line-height:1.6;">${content}</div>
    <div style="padding:16px 28px;background:#f6f8fd;border-top:1px solid #e6eaf2;font-size:12px;color:#5f6b85;">
      © ${new Date().getFullYear()} WebCodeShop · Code. Templates. Scripts. Solutions.
    </div>
  </div>
</body></html>`;
}

export async function sendWelcome(user) {
  return sendMail({
    to: user.email,
    subject: 'Welcome to WebCodeShop 👋',
    template: 'welcome',
    html: layout(`<h2>Hey ${user.name},</h2><p>Thanks for joining WebCodeShop! Your account is ready.</p><p>Browse premium code, templates, and gift cards at <a href="${process.env.APP_URL || 'http://localhost:3000'}/shop">webcodeshop.dev/shop</a>.</p><p>— The WebCodeShop team</p>`),
    text: `Welcome ${user.name}! Your WebCodeShop account is ready.`,
  });
}

export async function sendOrderReceipt(order) {
  const keysList = (order.keys || []).map(k => `<tr><td style="padding:8px 0;font-weight:600;">${k.name}</td><td style="padding:8px 0;font-family:monospace;color:#1e64ff;">${k.code}</td></tr>`).join('');
  return sendMail({
    to: order.email,
    subject: `Order confirmed — ${order.id}`,
    template: 'order-receipt',
    html: layout(`<h2>Thanks for your order!</h2><p>Order <b>${order.id}</b> has been confirmed. Your license keys are below.</p><table style="width:100%;border-collapse:collapse;margin:18px 0;border-top:1px solid #e6eaf2;border-bottom:1px solid #e6eaf2;">${keysList}</table><p><b>Total:</b> ₹${(order.total||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}</p><p><a href="${process.env.APP_URL || 'http://localhost:3000'}/account" style="background:#1e64ff;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">View in your account</a></p>`),
    text: `Order ${order.id} confirmed. Total ₹${(order.total||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`,
  });
}

export async function sendPasswordReset(user, resetUrl) {
  return sendMail({
    to: user.email,
    subject: 'Reset your WebCodeShop password',
    template: 'password-reset',
    html: layout(`<h2>Reset your password</h2><p>We received a request to reset your password. Click the button below to choose a new one. The link expires in 1 hour.</p><p><a href="${resetUrl}" style="background:#1e64ff;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block;margin:14px 0;">Reset password</a></p><p style="font-size:13px;color:#5f6b85;">If you didn't request this, you can safely ignore this email.</p>`),
    text: `Reset your WebCodeShop password: ${resetUrl}`,
  });
}
