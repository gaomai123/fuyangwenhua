const express = require('express');
const { all, get, run } = require('../db/database');
const { requireCustomer } = require('../middleware/customerAuth');

const router = express.Router();

const requiredFields = [
  'stage_name',
  'real_name',
  'phone',
  'city',
  'tags'
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

function validateArtistPayload(body) {
  const missingFields = requiredFields.filter((field) => !normalizeText(body[field]));

  if (missingFields.length > 0) {
    return {
      valid: false,
      message: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  return { valid: true };
}

function formatSalary(row) {
  if (row.salary_note === '\u9762\u8bae') {
    return '\u9762\u8bae';
  }

  const unit = row.salary_unit ? `/${row.salary_unit}` : '';

  if (row.salary_min && row.salary_max) {
    return `${row.salary_min}-${row.salary_max}${unit}`;
  }

  if (row.salary_min) {
    return `${row.salary_min}\u8d77${unit}`;
  }

  if (row.price) {
    return row.price;
  }

  return '';
}

function getReviewStatus(row) {
  return row.review_status || row.status || 'pending';
}

function getWorkStatus(row) {
  return row.work_status || 'available';
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

function mapPublicArtist(req, row) {
  return {
    id: row.id,
    stage_name: row.stage_name,
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
    salary_display: formatSalary(row),
    avatar_url: normalizeMediaUrl(req, row.avatar_url),
    photo_urls: normalizeMediaList(req, row.photo_urls),
    art_photo_urls: normalizeMediaList(req, row.art_photo_urls),
    life_photo_urls: normalizeMediaList(req, row.life_photo_urls),
    video_url: normalizeMediaUrl(req, row.video_url),
    review_status: getReviewStatus(row),
    work_status: getWorkStatus(row),
    can_book: getWorkStatus(row) === 'available',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

router.get('/', async (req, res) => {
  const province = normalizeText(req.query.province);
  const city = normalizeText(req.query.city);
  const district = normalizeText(req.query.district);
  const dispatchCity = normalizeText(req.query.dispatch_city);
  const gender = normalizeText(req.query.gender);
  const singingType = normalizeText(req.query.singing_type);
  const category = normalizeText(req.query.category);
  const tag = normalizeText(req.query.tag);
  const keyword = normalizeText(req.query.keyword);
  const workStatus = normalizeText(req.query.work_status);
  const available = normalizeText(req.query.available);

  const where = ['COALESCE(NULLIF(review_status, \'\'), status) = ?', 'COALESCE(is_hidden, 0) = 0'];
  const params = ['approved'];

  if (province) {
    where.push('province LIKE ?');
    params.push(`%${province}%`);
  }

  if (city) {
    where.push('city LIKE ?');
    params.push(`%${city}%`);
  }

  if (district) {
    where.push('district LIKE ?');
    params.push(`%${district}%`);
  }

  if (dispatchCity) {
    where.push('dispatch_cities LIKE ?');
    params.push(`%${dispatchCity}%`);
  }

  if (gender) {
    where.push('gender = ?');
    params.push(gender);
  }

  if (singingType) {
    where.push('singing_type LIKE ?');
    params.push(`%${singingType}%`);
  }

  if (category) {
    where.push('(category LIKE ? OR tags LIKE ?)');
    params.push(`%${category}%`, `%${category}%`);
  }

  if (tag) {
    where.push('tags LIKE ?');
    params.push(`%${tag}%`);
  }

  if (workStatus) {
    where.push('COALESCE(NULLIF(work_status, \'\'), \'available\') = ?');
    params.push(workStatus);
  } else if (available === 'true' || available === '1') {
    where.push('COALESCE(NULLIF(work_status, \'\'), \'available\') = ?');
    params.push('available');
  }

  if (keyword) {
    where.push(`(
      stage_name LIKE ?
      OR city LIKE ?
      OR province LIKE ?
      OR district LIKE ?
      OR dispatch_cities LIKE ?
      OR tags LIKE ?
      OR category LIKE ?
      OR singing_type LIKE ?
      OR bio LIKE ?
    )`);
    params.push(
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`,
      `%${keyword}%`
    );
  }

  try {
    const rows = await all(
      `SELECT *
      FROM artists
      WHERE ${where.join(' AND ')}
      ORDER BY created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map((row) => mapPublicArtist(req, row))
    });
  } catch (error) {
    console.error('Failed to list artists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list artists'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await get(
      `SELECT *
      FROM artists
      WHERE id = ?
        AND COALESCE(NULLIF(review_status, ''), status) = ?
        AND COALESCE(is_hidden, 0) = 0`,
      [req.params.id, 'approved']
    );

    if (!row) {
      res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
      return;
    }

    res.json({
      success: true,
      data: mapPublicArtist(req, row)
    });
  } catch (error) {
    console.error('Failed to get artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get artist'
    });
  }
});

router.post('/:id/bookings', async (req, res) => {
  const artistId = req.params.id;
  const contactName = normalizeText(req.body.contact_name);
  const phone = normalizeText(req.body.phone);

  if (!contactName || !phone) {
    res.status(400).json({
      success: false,
      message: '联系人和手机号不能为空'
    });
    return;
  }

  try {
    const artist = await get(
      `SELECT id, work_status
      FROM artists
      WHERE id = ?
        AND COALESCE(NULLIF(review_status, ''), status) = ?
        AND COALESCE(is_hidden, 0) = 0`,
      [artistId, 'approved']
    );

    if (!artist) {
      res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
      return;
    }

    if ((artist.work_status || 'available') !== 'available') {
      res.status(400).json({
        success: false,
        message: '该艺人当前不可预约'
      });
      return;
    }

    const result = await run(
      `INSERT INTO bookings (
        artist_id,
        contact_name,
        phone,
        city,
        event_time,
        budget,
        requirement,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        artistId,
        contactName,
        phone,
        normalizeText(req.body.city),
        normalizeText(req.body.event_time),
        normalizeText(req.body.budget),
        normalizeText(req.body.requirement)
      ]
    );

    res.status(201).json({
      success: true,
      message: '预约意向已提交',
      data: {
        id: result.id,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Failed to create booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking'
    });
  }
});

router.post('/', requireCustomer, async (req, res) => {
  const validation = validateArtistPayload(req.body);

  if (!validation.valid) {
    res.status(400).json({
      success: false,
      message: validation.message
    });
    return;
  }

  const artist = {
    stage_name: normalizeText(req.body.stage_name),
    real_name: normalizeText(req.body.real_name),
    phone: normalizeText(req.body.phone),
    city: normalizeText(req.body.city),
    tags: normalizeText(req.body.tags),
    height: normalizeNumber(req.body.height),
    age: normalizeNumber(req.body.age),
    gender: normalizeText(req.body.gender),
    province: normalizeText(req.body.province),
    district: normalizeText(req.body.district),
    dispatch_cities: normalizeText(req.body.dispatch_cities),
    category: normalizeText(req.body.category),
    singing_type: normalizeText(req.body.singing_type),
    bio: normalizeText(req.body.bio),
    price: normalizeText(req.body.price),
    salary_min: normalizeNumber(req.body.salary_min),
    salary_max: normalizeNumber(req.body.salary_max),
    salary_unit: normalizeText(req.body.salary_unit),
    salary_note: normalizeText(req.body.salary_note),
    avatar_url: normalizeText(req.body.avatar_url),
    photo_urls: normalizeText(req.body.photo_urls),
    art_photo_urls: normalizeText(req.body.art_photo_urls),
    life_photo_urls: normalizeText(req.body.life_photo_urls),
    video_url: normalizeText(req.body.video_url)
  };

  try {
    const result = await run(
      `INSERT INTO artists (
        customer_id,
        user_id,
        stage_name,
        real_name,
        phone,
        city,
        province,
        district,
        dispatch_cities,
        tags,
        height,
        age,
        gender,
        category,
        singing_type,
        bio,
        price,
        salary_min,
        salary_max,
        salary_unit,
        salary_note,
        avatar_url,
        photo_urls,
        art_photo_urls,
        life_photo_urls,
        video_url,
        status,
        review_status,
        work_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', 'available')`,
      [
        req.customer.id,
        req.customer.id,
        artist.stage_name,
        artist.real_name,
        artist.phone,
        artist.city,
        artist.province,
        artist.district,
        artist.dispatch_cities,
        artist.tags,
        artist.height,
        artist.age,
        artist.gender,
        artist.category,
        artist.singing_type,
        artist.bio,
        artist.price,
        artist.salary_min,
        artist.salary_max,
        artist.salary_unit,
        artist.salary_note,
        artist.avatar_url,
        artist.photo_urls,
        artist.art_photo_urls,
        artist.life_photo_urls,
        artist.video_url
      ]
    );

    await run(
      `UPDATE customers
      SET role = CASE WHEN role = 'artist' THEN role ELSE 'applicant' END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [req.customer.id]
    );

    res.status(201).json({
      success: true,
      message: '资料已提交，等待审核',
      data: {
        id: result.id,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Failed to create artist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit artist profile'
    });
  }
});

module.exports = router;
