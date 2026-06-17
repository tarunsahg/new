import { db } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import crypto from 'crypto';

function rowToProduct(r) {
  if (!r) return null;
  let images = [];
  try { images = r.images ? JSON.parse(r.images) : []; } catch { images = []; }
  if (!Array.isArray(images)) images = [];
  images = images.filter(Boolean);
  if (!images.length && r.image) images = [r.image];
  return {
    id: r.id, name: r.name, cat: r.cat, price: r.price, old: r.old_price || 0,
    icon: r.icon, image: images[0] || r.image || '', images, gr: r.gradient, rating: r.rating, reviews: r.reviews, sales: r.sales,
    desc: r.description, tag: r.tag || '', tagType: r.tag_type || '', createdAt: r.created_at,
  };
}

function normImages(p) {
  let imgs = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
  return imgs.filter(Boolean).slice(0, 5);
}

export async function GET() {
  return handle(async () => {
    const rows = db().prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    return ok({ products: rows.map(rowToProduct) });
  });
}

export async function POST(req) {
  return handle(async () => {
    requireAdmin();
    const p = await parseJSON(req);
    if (!p.name || !p.cat || p.price == null) throw httpError(400, 'name, cat, price required');
    const id = p.id || ('p' + crypto.randomBytes(4).toString('hex'));
    const imgs = normImages(p);
    db().prepare('INSERT INTO products (id,name,cat,price,old_price,icon,image,gradient,rating,reviews,sales,description,tag,tag_type,images) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
      id, p.name, p.cat, p.price, p.old || null, p.icon || '📦', imgs[0] || null, p.gr || 'linear-gradient(135deg,#1e64ff,#0b1f4d)',
      p.rating || 0, p.reviews || 0, p.sales || 0, p.desc || '', p.tag || null, p.tagType || null, JSON.stringify(imgs),
    );
    const row = db().prepare('SELECT * FROM products WHERE id=?').get(id);
    return ok({ product: rowToProduct(row) }, { status: 201 });
  });
}
