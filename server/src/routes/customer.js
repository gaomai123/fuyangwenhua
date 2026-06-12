const express = require('express');
const { all, get, run } = require('../db/database');
const { createCustomerToken, requireCustomer } = require('../middleware/customerAuth');

const router = express.Router();

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

async function getWechatSession(code) {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;

  if (!appid || !secret) {
    return {
      openid: 'dev-customer-openid',
      session_key: ''
    };
  }

  const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
  url.searchParams.set('appid', appid);
  url.searchParams.set('secret', secret);
  url.searchParams.set('js_code', code);
  url.searchParams.set('grant_type', 'authorization_code');

  const response = await fetch(url);
  const data = await response.json();

  if (!data.openid) {
    throw new Error(data.errmsg || '微信登录失败');
  }

  return data;
}

function mapResume(row) {
  return {
    id: row.id,
    stage_name: row.stage_name,
    real_name: row.real_name,
    phone: row.phone,
    city: row.city,
    tags: row.tags,
    category: row.category,
    review_status: row.review_status || row.status || 'pending',
    status: row.status,
    reject_reason: row.reject_reason,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapCustomer(customer) {
  return {
    id: customer.id,
    nickname: customer.nickname,
    avatar_url: customer.avatar_url,
    phone: customer.phone,
    role: customer.role || 'user',
    artist_id: customer.artist_id || null
  };
}

async function handleWechatLogin(req, res) {
  const code = normalizeText(req.body.code);

  if (!code) {
    res.status(400).json({
      success: false,
      message: '缺少微信登录 code'
    });
    return;
  }

  try {
    const session = await getWechatSession(code);
    const nickname = normalizeText(req.body.nickname);
    const avatarUrl = normalizeText(req.body.avatar_url);
    const unionid = normalizeText(session.unionid);
    let customer = await get('SELECT * FROM customers WHERE openid = ?', [session.openid]);

    if (!customer) {
      const result = await run(
        `INSERT INTO customers (openid, unionid, nickname, avatar_url, role)
        VALUES (?, ?, ?, ?, 'user')`,
        [session.openid, unionid, nickname, avatarUrl]
      );
      customer = await get('SELECT * FROM customers WHERE id = ?', [result.id]);
    } else {
      await run(
        `UPDATE customers
        SET unionid = COALESCE(NULLIF(?, ''), unionid),
            nickname = COALESCE(NULLIF(?, ''), nickname),
            avatar_url = COALESCE(NULLIF(?, ''), avatar_url),
            role = COALESCE(NULLIF(role, ''), 'user'),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [unionid, nickname, avatarUrl, customer.id]
      );
      customer = await get('SELECT * FROM customers WHERE id = ?', [customer.id]);
    }

    res.json({
      success: true,
      data: {
        token: createCustomerToken(customer),
        customer: mapCustomer(customer)
      }
    });
  } catch (error) {
    console.error('Failed to login customer:', error);
    res.status(500).json({
      success: false,
      message: error.message || '登录失败'
    });
  }
}

router.post('/login', handleWechatLogin);

router.get('/me', requireCustomer, async (req, res) => {
  try {
    const customer = await get(
      'SELECT id, nickname, avatar_url, phone, role, artist_id FROM customers WHERE id = ?',
      [req.customer.id]
    );

    if (!customer) {
      res.status(404).json({
        success: false,
        message: '客户不存在'
      });
      return;
    }

    res.json({
      success: true,
      data: mapCustomer(customer)
    });
  } catch (error) {
    console.error('Failed to get customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customer'
    });
  }
});

router.get('/resumes', requireCustomer, async (req, res) => {
  try {
    const rows = await all(
      `SELECT *
      FROM artists
      WHERE customer_id = ?
      ORDER BY created_at DESC`,
      [req.customer.id]
    );

    res.json({
      success: true,
      data: rows.map(mapResume)
    });
  } catch (error) {
    console.error('Failed to list customer resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list resumes'
    });
  }
});

router.handleWechatLogin = handleWechatLogin;
router.mapCustomer = mapCustomer;

module.exports = router;
