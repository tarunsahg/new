'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get('token') || '';
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (pw !== pw2) { setErr('Passwords do not match'); return; }
    setLoading(true); setErr(null);
    try {
      const r = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: pw }), credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Reset failed');
      router.push('/account');
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="auth-split">
      <section className="auth-form">
        <Link href="/login" className="auth-back">← Back to sign in</Link>
        <h1>Choose a new password</h1>
        <p className="auth-sub">Make it at least 6 characters. You'll be signed in once you save.</p>
        {!token ? (
          <div className="af-err">Missing reset token. Use the link from your email.</div>
        ) : (
          <form onSubmit={submit} className="af">
            <label className="field"><span>New password</span>
              <input type="password" value={pw} onChange={(e)=>setPw(e.target.value)} required minLength={6} autoFocus />
            </label>
            <label className="field"><span>Confirm password</span>
              <input type="password" value={pw2} onChange={(e)=>setPw2(e.target.value)} required minLength={6} />
            </label>
            {err && <div className="af-err">{err}</div>}
            <button className="btn-primary lg" disabled={loading}>{loading ? 'Saving…' : 'Save new password'}</button>
          </form>
        )}
      </section>
      <aside className="auth-promo">
        <div className="pill">Almost there</div>
        <h2>One click and you're back in.</h2>
        <p>After saving, you'll land on your account dashboard with all your orders and license keys.</p>
      </aside>
    </main>
  );
}

const loadingStyle = { padding: 60, textAlign: 'center' };
export default function ResetPassword() {
  return <Suspense fallback={<main className="container" style={loadingStyle}>Loading…</main>}><Inner /></Suspense>;
}
