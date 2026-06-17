import crypto from 'crypto';
import { db } from '@/lib/db';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import { sendPasswordReset } from '@/lib/mailer';

export async function POST(req) {
  return handle(async () => {
    const { email } = await parseJSON(req);
    const e = String(email || '').toLowerCase().trim();
    // Always return ok to avoid email enumeration.
    if (!e) return ok({ sent: true });
    const user = db().prepare('SELECT id,name,email FROM users WHERE email=?').get(e);
    if (user) {
      const token = crypto.randomBytes(24).toString('base64url');
      const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      db().prepare('INSERT INTO password_resets (token,user_id,expires_at) VALUES (?,?,?)').run(token, user.id, expires);
      const base = process.env.APP_URL || (new URL(req.url)).origin;
      const url = `${base}/reset-password?token=${token}`;
      sendPasswordReset(user, url).catch(() => {});
      // In development with no email provider configured, also return the URL so the user can click through.
      if (!process.env.RESEND_API_KEY) return ok({ sent: true, devResetUrl: url });
    }
    return ok({ sent: true });
  });
}
