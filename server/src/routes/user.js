const express = require('express');
const { all, get, run } = require('../db/database');
const { requireCustomer } = require('../middleware/customerAuth');

const router = express.Router();

const statusMap = {
  pending: { code: 'new', label: '已提交' },
  approved: { code: 'converted', label: '已录用' },
  rejected: { code: 'rejected', label: '暂不合适' },
  new: { code: 'new', label: '已提交' },
  contacted: { code: 'contacted', label: '平台已联系' },
  qualified: { code: 'qualified', label: '初步通过' },
  converted: { code: 'converted', label: '已录用' }
};

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

function mapSubmission(row) {
  const rawStatus = row.review_status || row.status || 'pending';
  const status = statusMap[rawStatus] || { code: rawStatus, label: rawStatus };

  return {
    id: row.id,
    artist_id: row.id,
    stage_name: row.stage_name,
    identity_type: row.category || row.tags || '音乐人',
    city: row.city,
    created_at: row.created_at,
    updated_at: row.updated_at,
    status: status.code,
    status_label: status.label,
    review_status: rawStatus,
    is_converted: status.code === 'converted',
    reject_reason: rawStatus === 'rejected' ? row.reject_reason : ''
  };
}

function formatSalary(row) {
  if (row.salary_note === '面议') {
    return '面议';
  }

  const unit = row.salary_unit ? `/${row.salary_unit}` : '';

  if (row.salary_min && row.salary_max) {
    return `${row.salary_min}-${row.salary_max}${unit}`;
  }

  if (row.salary_min) {
    return `${row.salary_min}起${unit}`;
  }

  return row.price || '';
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeMediaUrl(req, value) {
  const text = normalizeText(value);

  if (!text) {
    return '';
  }

  if (text.startsWith('/uploads/')) {
    return `${getBaseUrl(req)}${text}`;
  }

  try {
    const url = new URL(text);

    if (url.pathname.startsWith('/uploads/')) {
      return `${getBaseUrl(req)}${url.pathname}`;
    }
  } catch (error) {
    return text;
  }

  return text;
}

function normalizeMediaList(req, value) {
  return String(value || '')
    .split(',')
    .map((item) => normalizeMediaUrl(req, item))
    .filter(Boolean)
    .join(',');
}

function mapArtistProfile(req, row) {
  return {
    id: row.id,
    stage_name: row.stage_name,
    city: row.city,
    gender: row.gender,
    category: row.category || row.tags,
    singing_type: row.singing_type,
    dispatch_cities: row.dispatch_cities,
    price: row.price,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    salary_unit: row.salary_unit,
    salary_note: row.salary_note,
    salary_display: formatSalary(row),
    avatar_url: normalizeMediaUrl(req, row.avatar_url),
    photo_urls: normalizeMediaList(req, row.photo_urls),
    art_photo_urls: normalizeMediaList(req, row.art_photo_urls),
    life_photo_urls: normalizeMediaList(req, row.life_photo_urls),
    review_status: row.review_status || row.status,
    work_status: row.work_status || 'available',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

router.use(requireCustomer);

router.get('/profile', async (req, res) => {
  try {
    const customer = await get(
      'SELECT id, nickname, avatar_url, phone, role, artist_id FROM customers WHERE id = ?',
      [req.customer.id]
    );

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: mapCustomer(customer)
    });
  } catch (error) {
    console.error('Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

router.get('/submission-status', async (req, res) => {
  try {
    const rows = await all(
      `SELECT id, stage_name, city, tags, category, status, review_status, reject_reason, created_at, updated_at
      FROM artists
      WHERE customer_id = ? OR user_id = ?
      ORDER BY created_at DESC`,
      [req.customer.id, req.customer.id]
    );

    res.json({
      success: true,
      data: rows.map(mapSubmission)
    });
  } catch (error) {
    console.error('Failed to list submission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list submission status'
    });
  }
});

router.get('/artist-profile', async (req, res) => {
  try {
    const customer = await get(
      'SELECT id, role, artist_id FROM customers WHERE id = ?',
      [req.customer.id]
    );

    if (!customer || customer.role !== 'artist' || !customer.artist_id) {
      res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
      return;
    }

    const artist = await get(
      `SELECT *
      FROM artists
      WHERE id = ?
        AND (customer_id = ? OR user_id = ?)`,
      [customer.artist_id, req.customer.id, req.customer.id]
    );

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
      return;
    }

    res.json({
      success: true,
      data: mapArtistProfile(req, artist)
    });
  } catch (error) {
    console.error('Failed to get artist profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get artist profile'
    });
  }
});

router.get('/artist-status-requests', async (req, res) => {
  try {
    const rows = await all(
      `SELECT *
      FROM artist_status_requests
      WHERE user_id = ?
      ORDER BY created_at DESC`,
      [req.customer.id]
    );

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Failed to list artist status requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list artist status requests'
    });
  }
});

router.post('/artist-status-request', async (req, res) => {
  const requestedStatus = normalizeText(req.body.requested_status);
  const reason = normalizeText(req.body.reason);
  const allowedStatuses = ['available', 'on_duty', 'paused'];

  if (!allowedStatuses.includes(requestedStatus)) {
    res.status(400).json({
      success: false,
      message: 'Invalid requested status'
    });
    return;
  }

  try {
    const customer = await get(
      'SELECT id, role, artist_id FROM customers WHERE id = ?',
      [req.customer.id]
    );

    if (!customer || customer.role !== 'artist' || !customer.artist_id) {
      res.status(403).json({
        success: false,
        message: 'Only bound artists can submit status requests'
      });
      return;
    }

    const artist = await get(
      `SELECT id, work_status
      FROM artists
      WHERE id = ?
        AND (customer_id = ? OR user_id = ?)`,
      [customer.artist_id, req.customer.id, req.customer.id]
    );

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist profile not found'
      });
      return;
    }

    const pendingRequest = await get(
      `SELECT id
      FROM artist_status_requests
      WHERE user_id = ? AND artist_id = ? AND status = ?
      LIMIT 1`,
      [req.customer.id, artist.id, 'pending']
    );

    if (pendingRequest) {
      res.status(400).json({
        success: false,
        message: '已有待审核状态申请，请等待后台处理'
      });
      return;
    }

    const result = await run(
      `INSERT INTO artist_status_requests (
        user_id,
        artist_id,
        current_status,
        requested_status,
        reason,
        status
      ) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [
        req.customer.id,
        artist.id,
        artist.work_status || 'available',
        requestedStatus,
        reason
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.id,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Failed to create artist status request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create artist status request'
    });
  }
});

module.exports = router;
