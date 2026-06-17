import { requireAdmin, httpError } from '@/lib/auth-server';
import { ok, handle } from '@/lib/api-utils';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

const ALLOWED = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// POST  multipart/form-data  field: "file"  ->  { url: "/uploads/xxx.png" }
export async function POST(req) {
  return handle(async () => {
    requireAdmin();
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') throw httpError(400, 'No file provided');
    const ext = ALLOWED[file.type];
    if (!ext) throw httpError(400, 'Unsupported file type. Use PNG, JPG, WEBP, GIF or SVG.');
    if (file.size > MAX_BYTES) throw httpError(400, 'File too large (max 5 MB)');

    const buf = Buffer.from(await file.arrayBuffer());
    const dir = path.join(process.cwd(), 'public', 'uploads');
    fs.mkdirSync(dir, { recursive: true });
    const fname = 'p_' + Date.now().toString(36) + '_' + crypto.randomBytes(4).toString('hex') + '.' + ext;
    fs.writeFileSync(path.join(dir, fname), buf);

    return ok({ url: '/uploads/' + fname });
  });
}
