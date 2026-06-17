'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useApp } from '@/components/Providers';

const NAV = [
  { href: '/admin', label: 'Dashboard', ic: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { href: '/admin/products', label: 'Products', ic: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z' },
  { href: '/admin/categories', label: 'Categories', ic: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { href: '/admin/orders', label: 'Orders', ic: 'M3 6h2l2.4 11.2a2 2 0 002 1.6h7.6a2 2 0 002-1.6L20 9H6' },
  { href: '/admin/messages', label: 'Messages', ic: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
  { href: '/admin/coupons', label: 'Coupons', ic: 'M20 12a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v4a2 2 0 002 2 2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2v-4a2 2 0 00-2-2zM10 4v16' },
  { href: '/admin/customers', label: 'Customers', ic: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { href: '/admin/settings', label: 'Home & Style', ic: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a1 1 0 00.13-.2l2-3.46a1 1 0 00-.37-1.37l-2.12-1.22A7.07 7.07 0 0017.93 5l-.38-2.43a1 1 0 00-1-.85h-4a1 1 0 00-1 .85L11.18 5a7.07 7.07 0 00-1.11.64L7.95 4.42a1 1 0 00-1.37.37L4.46 8.25a1 1 0 00.37 1.37l2.12 1.22a7 7 0 000 2.32l-2.12 1.22a1 1 0 00-.37 1.37l2.12 3.46a1 1 0 001.37.37l2.12-1.22a7.07 7.07 0 001.11.64L11.55 21a1 1 0 001 .85h4a1 1 0 001-.85L17.93 19a7.07 7.07 0 001.11-.64l2.12 1.22a1 1 0 001.37-.37l2-3.46a1 1 0 00-.37-1.37l-2.12-1.22a7 7 0 000-2.32z' },
];

function NavIcon({ d }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

export default function AdminLayout({ children }) {
  const app = useApp();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!app) return;
    if (!app.hydrated) return;
    if (pathname === '/admin/login') return;
    if (!app.admin) router.push('/admin/login');
  }, [app, pathname, router]);

  if (pathname === '/admin/login') return <>{children}</>;
  if (!app || !app.admin) return null;

  const subBStyle = { fontSize: 11, fontWeight: 500, marginTop: 1, letterSpacing: '.04em', textTransform: 'uppercase' };
  const signOutStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, color: 'var(--muted)', fontSize: 14, fontWeight: 500, marginTop: 'auto', cursor: 'pointer', border: 0, background: 'transparent', width: '100%', textAlign: 'left' };

  return (
    <div className="adm-shell">
      <aside className="adm-side">
        <Link href="/admin" className="adm-brand">
          <img src="/logo-icon.png" alt={app.settings.brand} className="adm-brand-img" />
          <div><b>{app.settings.brand}</b><div className="muted" style={subBStyle}>Admin</div></div>
        </Link>
        <nav>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={pathname === n.href ? 'on' : ''}>
              <NavIcon d={n.ic} /><span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <button onClick={() => { app.adminLogout(); router.push('/admin/login'); }} style={signOutStyle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          <span>Sign out</span>
        </button>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
