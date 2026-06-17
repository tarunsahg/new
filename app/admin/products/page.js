'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/components/Providers';
import { money, catName } from '@/lib/format';

const GRADIENTS = [
  'linear-gradient(135deg,#0b1f4d,#1e64ff)',
  'linear-gradient(135deg,#1e64ff,#4a8bff)',
  'linear-gradient(135deg,#f57c3a,#ff9a5a)',
  'linear-gradient(135deg,#2bbf95,#4ad3ad)',
  'linear-gradient(135deg,#0ea5e9,#38bdf8)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#f97316)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#1e3a8a,#3b82f6)',
];

export default function AdminProducts() {
  const app = useApp();
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [sort, setSort] = useState('createdAt_desc');
  const [err, setErr] = useState('');
  if (!app || !app.admin) return null;

  const products = useMemo(() => {
    let arr = [...(app.products || [])];
    if (cat !== 'all') arr = arr.filter((p) => p.cat === cat);
    const t = q.trim().toLowerCase();
    if (t) arr = arr.filter((p) => (p.name || '').toLowerCase().includes(t) || (p.desc || '').toLowerCase().includes(t));
    const [key, dir] = sort.split('_');
    arr.sort((a, b) => {
      const av = a[key]; const bv = b[key];
      if (typeof av === 'string') return dir === 'desc' ? String(bv).localeCompare(av) : String(av).localeCompare(bv);
      return dir === 'desc' ? (bv || 0) - (av || 0) : (av || 0) - (bv || 0);
    });
    return arr;
  }, [app.products, q, cat, sort]);

  const newProduct = () => { setErr(''); setEditing({ id: '', name: '', cat: 'php', price: 29, old: 0, icon: '\ud83d\udce6', image: '', images: [], gr: GRADIENTS[0], desc: '', tag: '', tagType: '', rating: 4.8, reviews: 0, sales: 0, isNew: true }); };
  const edit = (p) => { setErr(''); setEditing({ ...p, images: (Array.isArray(p.images) && p.images.length) ? p.images : (p.image ? [p.image] : []) }); };
  const remove = (id) => { if (confirm('Delete this product?')) app.deleteProduct(id); };

  const uploadImage = async (file) => {
    if (!file) return;
    if (((editing && editing.images) || []).length >= 5) { setErr('You can upload up to 5 images per product'); return; }
    setErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error((data && data.error) || 'Upload failed');
      setEditing((prev) => { const imgs = [...((prev && prev.images) || []), data.url].slice(0, 5); return { ...prev, images: imgs, image: imgs[0] }; });
    } catch (e) {
      setErr(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setEditing((prev) => { const imgs = ((prev && prev.images) || []).filter((_, i) => i !== idx); return { ...prev, images: imgs, image: imgs[0] || '' }; });

  const previewStyle = editing ? { background: editing.image ? '#fff' : editing.gr } : {};

  const save = async () => {
    if (!editing.name || !editing.name.trim()) { setErr('Name is required'); return; }
    if (!editing.price || Number(editing.price) <= 0) { setErr('Price must be greater than 0'); return; }
    const payload = {
      ...editing,
      name: editing.name.trim(),
      price: Number(editing.price),
      old: Number(editing.old) || 0,
      rating: Number(editing.rating) || 0,
      reviews: Number(editing.reviews) || 0,
      sales: Number(editing.sales) || 0,
    };
    if (editing.isNew) delete payload.id;
    delete payload.isNew;
    const r = await app.saveProduct(payload);
    if (r && r.ok) setEditing(null); else setErr((r && r.error) || 'Save failed');
  };

  return (
    <>
      <header className="adm-page-head">
        <div><h1>Products</h1><p className="muted">{(app.products || []).length} products in your catalog.</p></div>
        <button className="btn btn-primary" onClick={newProduct}>+ Add product</button>
      </header>
      <section className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" />
          </div>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className="adm-select">
            <option value="all">All categories</option>
            {(app.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="adm-select">
            <option value="createdAt_desc">Newest first</option>
            <option value="name_asc">Name (A–Z)</option>
            <option value="price_desc">Price (high to low)</option>
            <option value="price_asc">Price (low to high)</option>
            <option value="sales_desc">Most sold</option>
          </select>
        </div>
        <table className="adm-table">
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Sales</th><th>Rating</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => {
              const iconStyle = { background: p.gr };
              return (
                <tr key={p.id}>
                  <td><div className="prod-cell"><div className="prod-icon" style={iconStyle}>{p.image ? <img src={p.image} alt={p.name} /> : p.icon}</div><div className="prod-meta"><b>{p.name}</b><span className="muted">{(p.desc || '').slice(0, 60)}{(p.desc || '').length > 60 ? '…' : ''}</span></div></div></td>
                  <td><span className="cat-pill">{catName(p.cat)}</span></td>
                  <td><b>{money(p.price)}</b>{p.old > 0 && <div className="muted strike">{money(p.old)}</div>}</td>
                  <td>{p.sales || 0}</td>
                  <td>★ {p.rating || 0} <span className="muted">({p.reviews || 0})</span></td>
                  <td style={actionStyle}>
                    <button className="btn btn-soft btn-sm" onClick={() => edit(p)}>Edit</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(p.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && <tr><td colSpan={6} className="empty-state small">No products match.</td></tr>}
          </tbody>
        </table>
      </section>

      {editing && (
        <div className="modal" onClick={() => setEditing(null)}>
          <div className="modal-card lg" onClick={(e) => e.stopPropagation()}>
            <h2>{editing.isNew ? 'Add product' : 'Edit product'}</h2>
            <div className="row2">
              <div className="field"><label>Name *</label><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="React Dashboard Pro" /></div>
              <div className="field"><label>Category</label>
                <select value={editing.cat} onChange={(e) => setEditing({ ...editing, cat: e.target.value })}>
                  {(app.categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="row3">
              <div className="field"><label>Price (₹) *</label><input type="number" step="0.01" value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
              <div className="field"><label>Compare-at (₹)</label><input type="number" step="0.01" value={editing.old} onChange={(e) => setEditing({ ...editing, old: e.target.value })} /></div>
              <div className="field"><label>Icon (emoji)</label><input value={editing.icon} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} maxLength={4} /></div>
            </div>
            <div className="field">
              <label>Product images <span className="muted">· up to 5</span></label>
              <div className="img-multi">
                {(editing.images || []).map((src, i) => {
                  const k = src + '_' + i;
                  return (
                    <div key={k} className="img-multi-item">
                      <img src={src} alt={'Image ' + (i + 1)} />
                      {i === 0 && <span className="img-multi-main">Main</span>}
                      <button type="button" className="img-multi-del" onClick={() => removeImage(i)} aria-label="Remove image">×</button>
                    </div>
                  );
                })}
                {(editing.images || []).length < 5 && (
                  <label className="img-multi-add">
                    <span>{uploading ? '…' : '+'}</span>
                    <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => uploadImage(e.target.files && e.target.files[0])} />
                  </label>
                )}
              </div>
              <span className="img-hint">The first image is the main thumbnail. Square images look best. PNG, JPG, WEBP or SVG · up to 5 MB each · max 5 images.</span>
            </div>
            <div className="field"><label>Description</label><textarea rows={3} value={editing.desc} onChange={(e) => setEditing({ ...editing, desc: e.target.value })} placeholder="Short product description shown on the storefront." /></div>
            <div className="row2">
              <div className="field"><label>Badge text (optional)</label><input value={editing.tag} onChange={(e) => setEditing({ ...editing, tag: e.target.value })} placeholder="BESTSELLER" /></div>
              <div className="field"><label>Badge style</label>
                <select value={editing.tagType} onChange={(e) => setEditing({ ...editing, tagType: e.target.value })}>
                  <option value="">None</option><option value="hot">Hot</option><option value="new">New</option><option value="sale">Sale</option><option value="pro">Pro</option>
                </select>
              </div>
            </div>
            <div className="field"><label>Icon background gradient</label>
              <div className="grad-picker">
                {GRADIENTS.map((g) => {
                  const sw = { background: g };
                  return <button key={g} type="button" className={'sw' + (editing.gr === g ? ' on' : '')} style={sw} onClick={() => setEditing({ ...editing, gr: g })} />;
                })}
              </div>
            </div>
            {err && <div className="err-banner">{err}</div>}
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing.isNew ? 'Create product' : 'Save changes'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const actionStyle = { display: 'flex', gap: 8, justifyContent: 'flex-end' };
