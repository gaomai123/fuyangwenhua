const crypto = require('crypto');

const TOKEN_SECRET = process.env.CUSTOMER_TOKEN_SECRET || 'local-customer-secret';
const TOKEN_EXPIRES_IN = 30 * 24 * 60 * 60 * 1000;

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

function createCustomerToken(customer) {
  const payload = base64UrlEncode({
    id: customer.id,
    openid: customer.openid,
    exp: Date.now() + TOKEN_EXPIRES_IN
  });

  return `${payload}.${sign(payload)}`;
}

function verifyCustomerToken(token) {
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

function requireCustomer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const customer = verifyCustomerToken(token);

  if (!customer) {
    res.status(401).json({
      success: false,
      message: '请先登录'
    });
    return;
  }

  req.customer = customer;
  next();
}

module.exports = {
  createCustomerToken,
  requireCustomer,
  verifyCustomerToken
};
