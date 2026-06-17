import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth-server';

export async function GET(req, { params }) {
  const code = params.code;
  const key = db().prepare('SELECT lk.*, o.user_id, o.customer_email, p.name as product_name, p.cat FROM license_keys lk LEFT JOIN orders o ON o.id=lk.order_id LEFT JOIN products p ON p.id=lk.product_id WHERE lk.code=?').get(code);
  if (!key) return NextResponse.json({ error: 'Invalid license key' }, { status: 404 });
  const me = getSessionUser();
  // Allow if logged-in owner of the order, admin, or email matches.
  const isOwner = me && (me.role === 'admin' || me.id === key.user_id || me.email === key.customer_email);
  if (!isOwner) return NextResponse.json({ error: 'Sign in to download this file' }, { status: 401 });

  // Generate a stub artifact — in a real app this would stream the actual file from storage.
  const filename = `${(key.product_name || 'item').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.txt`;
  const body = `WebCodeShop — Digital download\n=========================\nProduct: ${key.product_name}\nLicense key: ${key.code}\nOrder: ${key.order_id}\nDelivered: ${key.delivered_at}\n\nThank you for your purchase. This is a demo artifact file. In production, this endpoint should stream the real product file (zip, pdf, etc.) from object storage.\n`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
