const express = require('express');
const { all, get, hashPassword, run } = require('../db/database');
const { createAdminToken, requireAdmin } = require('../middleware/adminAuth');

const router = express.Router();

const editableFields = [
  'stage_name',
  'real_name',
  'phone',
  'wechat',
  'province',
  'city',
  'district',
  'dispatch_cities',
  'tags',
  'height',
  'age',
  'gender',
  'category',
  'singing_type',
  'bio',
  'price',
  'salary_min',
  'salary_max',
  'salary_unit',
  'salary_note',
  'internal_remark',
  'work_status',
  'is_hidden',
  'avatar_url',
  'photo_urls',
  'art_photo_urls',
  'life_photo_urls',
  'video_url'
];

const editableNewsFields = [
  'title',
  'category',
  'cover_url',
  'summary',
  'content',
  'image_urls',
  'video_url',
  'is_top',
  'status',
  'sort_order'
];

const editableFestivalCaseFields = [
  'title',
  'location',
  'tag',
  'cover_url',
  'video_url',
  'summary',
  'detail',
  'status',
  'sort_order'
];

const editableProductFields = [
  'name',
  'category',
  'cover_url',
  'image_urls',
  'summary',
  'specs',
  'detail',
  'contact_wechat',
  'contact_phone',
  'status',
  'sort_order'
];

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeNumber(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function normalizeArtistUpdate(body) {
  const data = {};

  editableFields.forEach((field) => {
    if (body[field] === undefined) {
      return;
    }

    if (field === 'height' || field === 'age' || field === 'salary_min' || field === 'salary_max' || field === 'is_hidden') {
      data[field] = normalizeNumber(body[field]);
      return;
    }

    data[field] = normalizeText(body[field]);
  });

  return data;
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
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

function mapAdminArtist(req, row) {
  return {
    id: row.id,
    stage_name: row.stage_name,
    real_name: row.real_name,
    phone: row.phone,
    wechat: row.wechat,
    province: row.province,
    city: row.city,
    district: row.district,
    dispatch_cities: row.dispatch_cities,
    tags: row.tags,
    height: row.height,
    age: row.age,
    gender: row.gender,
    category: row.category,
    singing_type: row.singing_type,
    bio: row.bio,
    price: row.price,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    salary_unit: row.salary_unit,
    salary_note: row.salary_note,
    internal_remark: row.internal_remark,
    avatar_url: normalizeMediaUrl(req, row.avatar_url),
    photo_urls: normalizeMediaList(req, row.photo_urls),
    art_photo_urls: normalizeMediaList(req, row.art_photo_urls),
    life_photo_urls: normalizeMediaList(req, row.life_photo_urls),
    video_url: normalizeMediaUrl(req, row.video_url),
    status: row.status,
    review_status: row.review_status,
    work_status: row.work_status,
    is_hidden: row.is_hidden,
    reject_reason: row.reject_reason,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapBooking(row) {
  return {
    id: row.id,
    artist_id: row.artist_id,
    artist_name: row.stage_name,
    contact_name: row.contact_name,
    phone: row.phone,
    city: row.booking_city,
    event_time: row.event_time,
    budget: row.budget,
    requirement: row.requirement,
    status: row.booking_status,
    created_at: row.booking_created_at,
    updated_at: row.booking_updated_at
  };
}

function mapFestivalLead(row) {
  return {
    id: row.id,
    contact_name: row.contact_name,
    phone: row.phone,
    company: row.company,
    city: row.city,
    event_date: row.event_date,
    cooperation_type: row.cooperation_type,
    requirement: row.requirement,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function normalizeFestivalCaseData(body) {
  const data = {};

  editableFestivalCaseFields.forEach((field) => {
    if (body[field] === undefined) {
      return;
    }

    if (field === 'sort_order') {
      data[field] = normalizeNumber(body[field]) || 0;
      return;
    }

    data[field] = normalizeText(body[field]);
  });

  return data;
}

function mapFestivalCase(req, row) {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    tag: row.tag,
    cover_url: normalizeMediaUrl(req, row.cover_url),
    image: normalizeMediaUrl(req, row.cover_url),
    video_url: normalizeMediaUrl(req, row.video_url),
    summary: row.summary,
    desc: row.summary,
    detail: row.detail,
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function normalizeNewsData(body) {
  const data = {};

  editableNewsFields.forEach((field) => {
    if (body[field] === undefined) {
      return;
    }

    if (field === 'is_top' || field === 'sort_order') {
      data[field] = normalizeNumber(body[field]) || 0;
      return;
    }

    data[field] = normalizeText(body[field]);
  });

  return data;
}

function mapNewsPost(req, row) {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    cover_url: normalizeMediaUrl(req, row.cover_url),
    summary: row.summary,
    content: row.content,
    image_urls: normalizeMediaList(req, row.image_urls),
    video_url: normalizeMediaUrl(req, row.video_url),
    is_top: row.is_top,
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function normalizeProductData(body) {
  const data = {};

  editableProductFields.forEach((field) => {
    if (body[field] === undefined) {
      return;
    }

    if (field === 'sort_order') {
      data[field] = normalizeNumber(body[field]) || 0;
      return;
    }

    data[field] = normalizeText(body[field]);
  });

  return data;
}

function mapProduct(req, row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    cover_url: normalizeMediaUrl(req, row.cover_url),
    image_urls: normalizeMediaList(req, row.image_urls),
    summary: row.summary,
    specs: row.specs,
    detail: row.detail,
    contact_wechat: row.contact_wechat,
    contact_phone: row.contact_phone,
    price_text: '批发价联系我们',
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function mapArtistStatusRequest(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    artist_id: row.artist_id,
    artist_name: row.stage_name,
    artist_city: row.city,
    artist_phone: row.phone,
    customer_nickname: row.nickname,
    current_status: row.current_status,
    requested_status: row.requested_status,
    reason: row.reason,
    admin_remark: row.admin_remark,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

async function getArtistById(id) {
  return get('SELECT * FROM artists WHERE id = ?', [id]);
}

router.post('/login', async (req, res) => {
  const username = normalizeText(req.body.username);
  const password = normalizeText(req.body.password);

  if (!username || !password) {
    res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
    return;
  }

  try {
    const admin = await get('SELECT * FROM admins WHERE username = ?', [username]);

    if (!admin || admin.password_hash !== hashPassword(password)) {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        token: createAdminToken(admin),
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Failed to login admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
});

router.use(requireAdmin);

router.get('/artists/pending', async (req, res) => {
  try {
    const rows = await all(
      'SELECT * FROM artists WHERE status = ? ORDER BY created_at DESC',
      ['pending']
    );

    res.json({
      success: true,
      data: rows.map((row) => mapAdminArtist(req, row))
    });
  } catch (error) {
    console.error('Failed to list pending artists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list pending artists'
    });
  }
});

router.get('/bookings', async (req, res) => {
  const status = normalizeText(req.query.status);
  const params = [];
  let where = '';

  if (status) {
    where = 'WHERE bookings.status = ?';
    params.push(status);
  }

  try {
    const rows = await all(
      `SELECT
        bookings.id,
        bookings.artist_id,
        bookings.contact_name,
        bookings.phone,
        bookings.city AS booking_city,
        bookings.event_time,
        bookings.budget,
        bookings.requirement,
        bookings.status AS booking_status,
        bookings.created_at AS booking_created_at,
        bookings.updated_at AS booking_updated_at,
        artists.stage_name
      FROM bookings
      LEFT JOIN artists ON artists.id = bookings.artist_id
      ${where}
      ORDER BY bookings.created_at DESC`
      ,
      params
    );

    res.json({
      success: true,
      data: rows.map(mapBooking)
    });
  } catch (error) {
    console.error('Failed to list bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list bookings'
    });
  }
});

router.patch('/bookings/:id', async (req, res) => {
  const status = normalizeText(req.body.status);
  const allowedStatuses = ['pending', 'contacted', 'closed'];

  if (!allowedStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid booking status'
    });
    return;
  }

  try {
    const result = await run(
      `UPDATE bookings
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [status, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Booking updated'
    });
  } catch (error) {
    console.error('Failed to update booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking'
    });
  }
});

router.get('/festival-leads', async (req, res) => {
  const status = normalizeText(req.query.status);
  const params = [];
  let where = '';

  if (status) {
    where = 'WHERE status = ?';
    params.push(status);
  }

  try {
    const rows = await all(
      `SELECT *
      FROM festival_leads
      ${where}
      ORDER BY created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map(mapFestivalLead)
    });
  } catch (error) {
    console.error('Failed to list festival leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list festival leads'
    });
  }
});

router.patch('/festival-leads/:id', async (req, res) => {
  const status = normalizeText(req.body.status);
  const allowedStatuses = ['pending', 'contacted', 'closed'];

  if (!allowedStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid festival lead status'
    });
    return;
  }

  try {
    const result = await run(
      `UPDATE festival_leads
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [status, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Festival lead not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Festival lead updated'
    });
  } catch (error) {
    console.error('Failed to update festival lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update festival lead'
    });
  }
});

router.get('/festival-cases', async (req, res) => {
  const status = normalizeText(req.query.status);
  const params = [];
  let where = '';

  if (status) {
    where = 'WHERE status = ?';
    params.push(status);
  }

  try {
    const rows = await all(
      `SELECT *
      FROM festival_cases
      ${where}
      ORDER BY sort_order DESC, created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map((row) => mapFestivalCase(req, row))
    });
  } catch (error) {
    console.error('Failed to list festival cases:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list festival cases'
    });
  }
});

router.post('/festival-cases', async (req, res) => {
  const data = normalizeFestivalCaseData(req.body);

  if (!data.title || !data.location) {
    res.status(400).json({
      success: false,
      message: 'Title and location are required'
    });
    return;
  }

  const status = ['draft', 'published', 'hidden'].includes(data.status) ? data.status : 'published';

  try {
    const result = await run(
      `INSERT INTO festival_cases (
        title,
        location,
        tag,
        cover_url,
        video_url,
        summary,
        detail,
        status,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.location,
        data.tag || '',
        data.cover_url || '',
        data.video_url || '',
        data.summary || '',
        data.detail || '',
        status,
        data.sort_order || 0
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.id
      }
    });
  } catch (error) {
    console.error('Failed to create festival case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create festival case'
    });
  }
});

router.put('/festival-cases/:id', async (req, res) => {
  const data = normalizeFestivalCaseData(req.body);
  const fields = Object.keys(data);

  if (fields.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No editable fields provided'
    });
    return;
  }

  if (data.status && !['draft', 'published', 'hidden'].includes(data.status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid festival case status'
    });
    return;
  }

  try {
    const assignments = fields.map((field) => `${field} = ?`);
    const values = fields.map((field) => data[field]);
    const result = await run(
      `UPDATE festival_cases
      SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [...values, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Festival case not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Festival case updated'
    });
  } catch (error) {
    console.error('Failed to update festival case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update festival case'
    });
  }
});

router.patch('/festival-cases/:id/status', async (req, res) => {
  const status = normalizeText(req.body.status);

  if (!['draft', 'published', 'hidden'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid festival case status'
    });
    return;
  }

  try {
    const result = await run(
      `UPDATE festival_cases
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [status, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Festival case not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Festival case status updated'
    });
  } catch (error) {
    console.error('Failed to update festival case status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update festival case status'
    });
  }
});

router.delete('/festival-cases/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM festival_cases WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Festival case not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Festival case deleted'
    });
  } catch (error) {
    console.error('Failed to delete festival case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete festival case'
    });
  }
});

router.post('/maintenance/hide-test-data', async (req, res) => {
  try {
    const artistResult = await run(
      `UPDATE artists
      SET is_hidden = 1, updated_at = CURRENT_TIMESTAMP
      WHERE COALESCE(is_hidden, 0) = 0
        AND (
          stage_name LIKE ?
          OR real_name LIKE ?
          OR phone = ?
        )`,
      ['%测试%', '%测试%', '13800138000']
    );

    const bookingResult = await run(
      `UPDATE bookings
      SET status = 'closed', updated_at = CURRENT_TIMESTAMP
      WHERE status != 'closed'
        AND (
          contact_name LIKE ?
          OR phone = ?
          OR requirement LIKE ?
        )`,
      ['%测试%', '13800138000', '%测试%']
    );

    res.json({
      success: true,
      message: 'Test data hidden',
      data: {
        hidden_artists: artistResult.changes,
        closed_bookings: bookingResult.changes
      }
    });
  } catch (error) {
    console.error('Failed to hide test data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to hide test data'
    });
  }
});

router.get('/news', async (req, res) => {
  const status = normalizeText(req.query.status);
  const category = normalizeText(req.query.category);
  const params = [];
  const where = [];

  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  if (category) {
    where.push('category = ?');
    params.push(category);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const rows = await all(
      `SELECT *
      FROM news_posts
      ${whereSql}
      ORDER BY is_top DESC, sort_order DESC, created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map((row) => mapNewsPost(req, row))
    });
  } catch (error) {
    console.error('Failed to list admin news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list news'
    });
  }
});

router.post('/news', async (req, res) => {
  const data = normalizeNewsData(req.body);

  if (!data.title || !data.category) {
    res.status(400).json({
      success: false,
      message: 'Title and category are required'
    });
    return;
  }

  const status = ['draft', 'published', 'hidden'].includes(data.status) ? data.status : 'draft';

  try {
    const result = await run(
      `INSERT INTO news_posts (
        title,
        category,
        cover_url,
        summary,
        content,
        image_urls,
        video_url,
        is_top,
        status,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.category,
        data.cover_url || '',
        data.summary || '',
        data.content || '',
        data.image_urls || '',
        data.video_url || '',
        data.is_top || 0,
        status,
        data.sort_order || 0
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.id
      }
    });
  } catch (error) {
    console.error('Failed to create news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news'
    });
  }
});

router.put('/news/:id', async (req, res) => {
  const data = normalizeNewsData(req.body);
  const fields = Object.keys(data);

  if (fields.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No editable fields provided'
    });
    return;
  }

  if (data.status && !['draft', 'published', 'hidden'].includes(data.status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid news status'
    });
    return;
  }

  try {
    const assignments = fields.map((field) => `${field} = ?`);
    const values = fields.map((field) => data[field]);
    const result = await run(
      `UPDATE news_posts
      SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [...values, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'News not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'News updated'
    });
  } catch (error) {
    console.error('Failed to update news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news'
    });
  }
});

router.patch('/news/:id/status', async (req, res) => {
  const status = normalizeText(req.body.status);

  if (!['draft', 'published', 'hidden'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid news status'
    });
    return;
  }

  try {
    const result = await run(
      `UPDATE news_posts
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [status, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'News not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'News status updated'
    });
  } catch (error) {
    console.error('Failed to update news status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news status'
    });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM news_posts WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'News not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'News deleted'
    });
  } catch (error) {
    console.error('Failed to delete news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete news'
    });
  }
});

router.get('/products', async (req, res) => {
  const status = normalizeText(req.query.status);
  const category = normalizeText(req.query.category);
  const params = [];
  const where = [];

  if (status) {
    where.push('status = ?');
    params.push(status);
  }

  if (category) {
    where.push('category = ?');
    params.push(category);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const rows = await all(
      `SELECT *
      FROM wholesale_products
      ${whereSql}
      ORDER BY sort_order DESC, created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map((row) => mapProduct(req, row))
    });
  } catch (error) {
    console.error('Failed to list admin products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list products'
    });
  }
});

router.post('/products', async (req, res) => {
  const data = normalizeProductData(req.body);

  if (!data.name || !data.category) {
    res.status(400).json({
      success: false,
      message: 'Name and category are required'
    });
    return;
  }

  const status = ['draft', 'published', 'hidden'].includes(data.status) ? data.status : 'draft';

  try {
    const result = await run(
      `INSERT INTO wholesale_products (
        name,
        category,
        cover_url,
        image_urls,
        summary,
        specs,
        detail,
        contact_wechat,
        contact_phone,
        status,
        sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.category,
        data.cover_url || '',
        data.image_urls || '',
        data.summary || '',
        data.specs || '',
        data.detail || '',
        data.contact_wechat || '',
        data.contact_phone || '',
        status,
        data.sort_order || 0
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.id
      }
    });
  } catch (error) {
    console.error('Failed to create product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product'
    });
  }
});

router.put('/products/:id', async (req, res) => {
  const data = normalizeProductData(req.body);
  const fields = Object.keys(data);

  if (fields.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No editable fields provided'
    });
    return;
  }

  if (data.status && !['draft', 'published', 'hidden'].includes(data.status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid product status'
    });
    return;
  }

  try {
    const assignments = fields.map((field) => `${field} = ?`);
    const values = fields.map((field) => data[field]);
    const result = await run(
      `UPDATE wholesale_products
      SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [...values, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product updated'
    });
  } catch (error) {
    console.error('Failed to update product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product'
    });
  }
});

router.patch('/products/:id/status', async (req, res) => {
  const status = normalizeText(req.body.status);

  if (!['draft', 'published', 'hidden'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid product status'
    });
    return;
  }

  try {
    const result = await run(
      `UPDATE wholesale_products
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [status, req.params.id]
    );

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product status updated'
    });
  } catch (error) {
    console.error('Failed to update product status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product status'
    });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const result = await run('DELETE FROM wholesale_products WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted'
    });
  } catch (error) {
    console.error('Failed to delete product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
});

router.get('/artist-status-requests', async (req, res) => {
  const status = normalizeText(req.query.status);
  const params = [];
  const where = [];

  if (status) {
    where.push('artist_status_requests.status = ?');
    params.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  try {
    const rows = await all(
      `SELECT
        artist_status_requests.*,
        artists.stage_name,
        artists.city,
        artists.phone,
        customers.nickname
      FROM artist_status_requests
      LEFT JOIN artists ON artists.id = artist_status_requests.artist_id
      LEFT JOIN customers ON customers.id = artist_status_requests.user_id
      ${whereSql}
      ORDER BY artist_status_requests.created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map(mapArtistStatusRequest)
    });
  } catch (error) {
    console.error('Failed to list artist status requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list artist status requests'
    });
  }
});

router.patch('/artist-status-requests/:id/review', async (req, res) => {
  const status = normalizeText(req.body.status);
  const adminRemark = normalizeText(req.body.admin_remark);

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({
      success: false,
      message: 'Invalid review status'
    });
    return;
  }

  try {
    const requestRow = await get(
      `SELECT *
      FROM artist_status_requests
      WHERE id = ?`,
      [req.params.id]
    );

    if (!requestRow) {
      res.status(404).json({
        success: false,
        message: 'Status request not found'
      });
      return;
    }

    if (requestRow.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: 'Status request has already been reviewed'
      });
      return;
    }

    if (status === 'approved') {
      await run(
        `UPDATE artists
        SET work_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [requestRow.requested_status, requestRow.artist_id]
      );
    }

    await run(
      `UPDATE artist_status_requests
      SET status = ?, admin_remark = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [status, adminRemark, req.params.id]
    );

    res.json({
      success: true,
      message: 'Status request reviewed'
    });
  } catch (error) {
    console.error('Failed to review artist status request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review artist status request'
    });
  }
});

router.get('/artists', async (req, res) => {
  const status = normalizeText(req.query.status);
  const params = [];
  let sql = 'SELECT * FROM artists';

  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  try {
    const rows = await all(sql, params);

    res.json({
      success: true,
      data: rows.map((row) => mapAdminArtist(req, row))
    });
  } catch (error) {
    console.error('Failed to list admin artists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list artists'
    });
  }
});

router.patch('/artists/:id/approve', async (req, res) => {
  try {
    const artist = await getArtistById(req.params.id);

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
      return;
    }

    await run(
      `UPDATE artists
      SET status = ?, review_status = ?, user_id = COALESCE(user_id, customer_id), reject_reason = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      ['approved', 'approved', req.params.id]
    );

    if (artist.customer_id || artist.user_id) {
      await run(
        `UPDATE customers
        SET role = 'artist',
            artist_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [req.params.id, artist.user_id || artist.customer_id]
      );
    }

    res.json({
      success: true,
      message: 'Artist approved'
    });
  } catch (error) {
    console.error('Failed to approve artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve artist'
    });
  }
});

router.patch('/artists/:id/reject', async (req, res) => {
  const reason = normalizeText(req.body.reason);

  try {
    const artist = await getArtistById(req.params.id);

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
      return;
    }

    await run(
      `UPDATE artists
      SET status = ?, review_status = ?, reject_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      ['rejected', 'rejected', reason, req.params.id]
    );

    res.json({
      success: true,
      message: 'Artist rejected'
    });
  } catch (error) {
    console.error('Failed to reject artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject artist'
    });
  }
});

router.patch('/artists/:id', async (req, res) => {
  const data = normalizeArtistUpdate(req.body);
  const fields = Object.keys(data);

  if (fields.length === 0) {
    res.status(400).json({
      success: false,
      message: 'No editable fields provided'
    });
    return;
  }

  try {
    const artist = await getArtistById(req.params.id);

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
      return;
    }

    const assignments = fields.map((field) => `${field} = ?`);
    const values = fields.map((field) => data[field]);

    await run(
      `UPDATE artists
      SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [...values, req.params.id]
    );

    res.json({
      success: true,
      message: 'Artist updated'
    });
  } catch (error) {
    console.error('Failed to update artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update artist'
    });
  }
});

router.delete('/artists/:id', async (req, res) => {
  try {
    const artist = await getArtistById(req.params.id);

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
      return;
    }

    await run('DELETE FROM artists WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Artist deleted'
    });
  } catch (error) {
    console.error('Failed to delete artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete artist'
    });
  }
});

module.exports = router;
