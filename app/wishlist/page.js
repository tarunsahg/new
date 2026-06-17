'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const app = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!app || !app.hydrated) return;
    if (!app.user) router.replace('/login?next=/wishlist');
  }, [app, router]);

  if (!app || !app.user) return null;
  const items = (app.products || []).filter(p => app.wishlistIds && app.wishlistIds.includes(p.id));

  return (
    <main className="container" style={pageStyle}>
      <div className="wl-head">
        <Link href="/account" className="crumb">← Back to account</Link>
        <h1>Your wishlist</h1>
        <p className="muted">{items.length} item{items.length === 1 ? '' : 's'} saved for later.</p>
      </div>

      {items.length === 0 ? (
        <div className="wl-empty">
          <div className="wl-empty-ico">♡</div>
          <h3>Nothing saved yet</h3>
          <p>Tap the heart on any product to save it here.</p>
          <Link href="/shop" className="btn-primary">Browse products</Link>
        </div>
      ) : (
        <div className="grid-4">
          {items.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </main>
  );
}

const pageStyle = { padding: '32px 16px 80px' };
