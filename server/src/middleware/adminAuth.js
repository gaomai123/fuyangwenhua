const crypto = require('crypto');

const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'local-admin-secret';
const TOKEN_EXPIRES_IN = 24 * 60 * 60 * 1000;

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function sign(payload) {
  return crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
}

function createAdminToken(admin) {
  const payload = base64UrlEncode({
    id: admin.id,
    username: admin.username,
    exp: Date.now() + TOKEN_EXPIRES_IN
  });

  return `${payload}.${sign(payload)}`;
}

function verifyAdminToken(token) {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (signature !== sign(payload)) {
    return null;
  }

  const data = base64UrlDecode(payload);

  if (!data.exp || data.exp < Date.now()) {
    return null;
  }

  return data;
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const admin = verifyAdminToken(token);

  if (!admin) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
    return;
  }

  req.admin = admin;
  next();
}

module.exports = {
  createAdminToken,
  requireAdmin,
  verifyAdminToken
};
