import { db, genKey } from '@/lib/db';
import { requireAdmin, getSessionUser, httpError } from '@/lib/auth-server';
import { ok, handle, parseJSON } from '@/lib/api-utils';
import { sendOrderReceipt } from '@/lib/mailer';

function expandOrder(o) {
  const items = db().prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id);
  const keys = db().prepare('SELECT * FROM license_keys WHERE order_id=?').all(o.id);
  return {
    id: o.id, status: o.status, total: o.total, subtotal: o.subtotal, discount: o.discount, coupon: o.coupon_code,
    name: o.customer_name, email: o.customer_email, userId: o.user_id, date: o.placed_at,
    paymentMethod: o.payment_method, txnId: o.txn_id, adminMessage: o.admin_message,
    items: items.map(i => ({ pid: i.product_id, name: i.product_name, qty: i.qty, price: i.price })),
    keys: keys.map(k => ({ pid: k.product_id, name: k.product_name, code: k.code, deliveredAt: k.delivered_at })),
  };
}

export async function GET(_req, { params }) {
  return handle(async () => {
    const u = getSessionUser();
    if (!u) throw httpError(401, 'Not authenticated');
    const o = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
    if (!o) throw httpError(404, 'Order not found');
    if (u.role !== 'admin' && o.user_id !== u.id && o.customer_email !== u.email) throw httpError(403, 'Forbidden');
    return ok({ order: expandOrder(o) });
  });
}

export async function PATCH(req, { params }) {
  return handle(async () => {
    requireAdmin();
    const { status, message, addKey, keyName } = await parseJSON(req);
    const existing = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
    if (!existing) throw httpError(404, 'Order not found');
    if (typeof message === 'string') {
      db().prepare('UPDATE orders SET admin_message=? WHERE id=?').run(message.trim() || null, params.id);
    }
    if (typeof addKey === 'string' && addKey.trim()) {
      db().prepare('INSERT INTO license_keys (order_id, product_id, product_name, code) VALUES (?, ?, ?, ?)').run(params.id, null, (keyName && keyName.trim()) || 'Custom license key', addKey.trim());
    }
    if (status === undefined) {
      const o0 = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
      return ok({ order: expandOrder(o0) });
    }
    const allowed = ['pending', 'completed', 'refunded', 'failed'];
    if (!allowed.includes(status)) throw httpError(400, 'Invalid status');
    const tx = db().transaction(() => {
      db().prepare('UPDATE orders SET status=? WHERE id=?').run(status, params.id);
      // Manual fulfilment: approving an order no longer auto-generates keys.
      // The admin delivers keys manually via "Deliver a custom key". We only
      // record the sale so analytics stay accurate.
      if (status === 'completed' && existing.status !== 'completed') {
        const lineItems = db().prepare('SELECT * FROM order_items WHERE order_id=?').all(params.id);
        const psales = db().prepare('UPDATE products SET sales=sales+? WHERE id=?');
        for (const it of lineItems) { if (it.product_id) psales.run(it.qty, it.product_id); }
      }
    });
    tx();
    const o = db().prepare('SELECT * FROM orders WHERE id=?').get(params.id);
    if (status === 'completed' && existing.status !== 'completed') sendOrderReceipt(expandOrder(o)).catch(() => {});
    return ok({ order: expandOrder(o) });
  });
}

export async function DELETE(_req, { params }) {
  return handle(async () => {
    requireAdmin();
    db().prepare('DELETE FROM orders WHERE id=?').run(params.id);
    return ok({ success: true });
  });
}
