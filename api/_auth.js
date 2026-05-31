// api/_auth.js — cek admin token
export function requireAdmin(req, res) {
  const token  = req.headers['x-admin-token'] || '';
  const secret = process.env.ADMIN_SECRET || '';
  if (!secret || token !== secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
}
