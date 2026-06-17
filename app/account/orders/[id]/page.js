'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import { money } from '@/lib/format';

const loadStyle = { padding: '80px 20px', textAlign: 'center', color: 'var(--muted)' };

function orderStatusInfo(status, hasKeys) {
  if (status === 'pending') return { label: 'Pending', bg: '#fef3c7', fg: '#92400e' };
  if (status === 'refunded') return { label: 'Refunded', bg: '#fee2e2', fg: '#991b1b' };
  if (status === 'failed') return { label: 'Failed', bg: '#fee2e2', fg: '#991b1b' };
  if (status === 'completed' && !hasKeys) return { label: 'Processing', bg: '#dbeafe', fg: '#1e40af' };
  return { label: 'Completed', bg: '#dcfce7', fg: '#166534' };
}

export default function TrackOrder() {
  const app = useApp();
  const router = useRouter();
  const params = useParams();
  const id = params && params.id ? decodeURIComponent(params.id) : '';

  useEffect(() => {
    if (app && app.hydrated && !app.user) router.push('/login?next=/account');
  }, [app, router]);

  if (!app || !app.hydrated) return <div className="container" style={loadStyle}>Loading…</div>;
  if (!app.user) return null;

  const orders = (app.orders || []).filter((o) => o.userId === app.user.id || o.email === app.user.email);
  const o = orders.find((x) => x.id === id);

  if (!o) {
    return (
      <div className="track-page">
        <Link href="/account" className="back">← Back to account</Link>
        <div className="shop-empty">
          <div className="ic">🔍</div>
          <h3>Order not found</h3>
          <p className="muted">We couldn&apos;t find an order with that number on your account.</p>
          <Link href="/account" className="btn btn-primary">Back to orders</Link>
        </div>
      </div>
    );
  }

  const isPending = o.status === 'pending';
  const isCompleted = o.status === 'completed';
  const isBad = o.status === 'failed' || o.status === 'refunded';
  const hasKeys = o.keys && o.keys.length > 0;
  const sk = orderStatusInfo(o.status, hasKeys);
  const badgeStyle = { background: sk.bg, color: sk.fg };
  const itemCount = (o.items || []).length;

  const steps = [
    { t: 'Order placed', d: 'We received your order', done: true },
    { t: isBad ? (o.status === 'refunded' ? 'Refunded' : 'Payment failed') : 'Payment confirmed', d: isPending ? 'Verifying your payment…' : (isBad ? 'Could not be completed' : 'Payment received'), done: !isPending && !isBad, active: isPending, bad: isBad },
    { t: 'Keys delivered', d: hasKeys ? 'License keys are ready' : 'Awaiting delivery', done: hasKeys, active: !hasKeys && !isPending && !isBad },
    { t: 'Completed', d: hasKeys ? 'Order complete — enjoy!' : 'Keys will be delivered shortly', done: isCompleted && hasKeys },
  ];

  return (
    <div className="track-page">
      <Link href="/account" className="back">← Back to account</Link>
      <div className="track-head">
        <div>
          <h1>Order {o.id}</h1>
          <p>{new Date(o.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} · {itemCount} item{itemCount === 1 ? '' : 's'} · {money(o.total)}</p>
        </div>
        <span className="badge" style={badgeStyle}>{sk.label}</span>
      </div>

      <div className="track-layout">
        <div className="acct-order-track">
          <div className="aot-title">Track order</div>
          <ol className="aot-steps">
            {steps.map((s, si) => (
              <li key={si} className={'aot-step' + (s.done ? ' done' : '') + (s.active ? ' active' : '') + (s.bad ? ' bad' : '')}>
                <span className="aot-dot">{s.done ? '✓' : si + 1}</span>
                <div className="aot-txt"><b>{s.t}</b><span>{s.d}</span></div>
              </li>
            ))}
          </ol>
        </div>

        <div className="track-detail">
          {o.adminMessage && (
            <div className="ord-note">
              <span className="ord-note-ic">💬</span>
              <div><div className="ord-note-lbl">Message from team</div><p>{o.adminMessage}</p></div>
            </div>
          )}
          {isPending && (
            <div className="ord-pending-note">⏳ Payment under verification{o.txnId ? ' · Txn ID ' + o.txnId : ''}. Your license keys will appear here once approved.</div>
          )}

          {hasKeys ? (
            <div className="keys">
              <h5>License keys</h5>
              {o.keys.map((k, i) => (
                <div key={i} className="keyrow">
                  <div>
                    <div className="kn">{k.name}</div>
                    <code>{k.code}</code>
                  </div>
                  <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard.writeText(k.code); app.showToast('Key copied', 'success'); }}>Copy</button>
                </div>
              ))}
            </div>
          ) : (!isBad && !isPending) ? (
            <div className="track-keys-empty">🔑 Your license keys will appear here once your order is approved and delivered.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
