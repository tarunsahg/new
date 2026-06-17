import { db } from '@/lib/db';
import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';

export async function DELETE(_req, { params }) {
  return handle(async () => {
    requireAdmin();
    const u = db().prepare('SELECT id,role FROM users WHERE id=?').get(params.id);
    if (!u) throw httpError(404, 'User not found');
    if (u.role === 'admin') throw httpError(400, 'Cannot delete admin user');
    db().prepare('DELETE FROM users WHERE id=?').run(params.id);
    return ok({ success: true });
  });
}
