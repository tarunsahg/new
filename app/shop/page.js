'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/Providers';
import ProductCard from '@/components/ProductCard';
import { catName } from '@/lib/format';

function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="container">Loading...</div>}>
      <ShopContent />
    </Suspense>
  );
}

function ShopContent() {
  const app = useApp();
  const sp = useSearchParams();
  const router = useRouter();

  const [sort, setSort] = useState('popular');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [priceMax, setPriceMax] = useState(8000);
  const [view, setView] = useState('grid');

  useEffect(() => {
    setCat(sp.get('c') || 'all');
    setQ(sp.get('q') || '');
  }, [sp]);

  const products = useMemo(() => {
    if (!app) return [];

    let list = [...app.products];

    if (cat !== 'all') {
      list = list.filter((p) => p.cat === cat);
    }

    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          (p.desc || '').toLowerCase().includes(q.toLowerCase())
      );
    }

    if (priceMax < 8000) {
      list = list.filter((p) => p.price <= priceMax);
    }

    switch (sort) {
      case 'popular':
        list.sort((a, b) => (b.sales || 0) - (a.sales || 0));
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'price-low':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return list;
  }, [app, cat, q, sort, priceMax]);

  if (!app) return null;

  const setCatNav = (id) => {
    router.push(id === 'all' ? '/shop' : `/shop?c=${id}`);
  };

  const clearAll = () => {
    setCat('all');
    setQ('');
    setPriceMax(8000);
    router.push('/shop');
  };

  const hasFilters = cat !== 'all' || q || priceMax < 8000;

  return (
    <>
      {/* Keep all your existing JSX here exactly as it is */}
      {/* Everything from <section className="shop-hero"> onwards */}
    </>
  );
}

const priceRangeStyle = { padding: '4px 4px 8px' };
const priceSliderStyle = { width: '100%', accentColor: 'var(--accent)' };
const priceLabelsStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 12,
  color: 'var(--muted)',
  marginTop: 6,
};
const priceMaxStyle = {
  color: 'var(--accent)',
  fontWeight: 700,
};
const emptyMuted = {
  marginTop: 6,
  marginBottom: 18,
};
