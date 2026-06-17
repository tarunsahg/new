'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devUrl, setDevUrl] = useState(null);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/auth/password-reset/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }), credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Request failed');
      setSent(true);
      if (data.devResetUrl) setDevUrl(data.devResetUrl);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="auth-split">
      <section className="auth-form">
        <Link href="/login" className="auth-back">← Back to sign in</Link>
        <h1>Reset your password</h1>
        <p className="auth-sub">Enter your email and we'll send you a link to choose a new password.</p>
        {!sent ? (
          <form onSubmit={submit} className="af">
            <label className="field"><span>Email</span>
              <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required autoFocus placeholder="you@example.com" />
            </label>
            {err && <div className="af-err">{err}</div>}
            <button className="btn-primary lg" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
          </form>
        ) : (
          <div className="af-ok">
            <div className="af-ok-ico">✉️</div>
            <h3>Check your inbox</h3>
            <p>If an account exists for <b>{email}</b>, we just sent a password reset link. The link expires in 1 hour.</p>
            {devUrl && (
              <div className="af-dev">
                <small>Dev mode (no email provider configured)</small>
                <a href={devUrl} className="btn-outline">Open reset link →</a>
              </div>
            )}
          </div>
        )}
        <p className="af-switch">Remember it? <Link href="/login">Sign in</Link></p>
      </section>
      <aside className="auth-promo">
        <div className="pill">Account recovery</div>
        <h2>We've got you covered.</h2>
        <p>Reset links expire in 1 hour for your security. After resetting, you'll be signed in automatically.</p>
      </aside>
    </main>
  );
}
