const express = require('express');
const { all, get, run } = require('../db/database');

const router = express.Router();

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
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

  return text;
}

function mapFestivalCase(req, row) {
  return {
    id: row.id,
    tag: row.tag,
    title: row.title,
    location: row.location,
    desc: row.summary,
    detail: row.detail,
    image: normalizeMediaUrl(req, row.cover_url),
    cover_url: normalizeMediaUrl(req, row.cover_url),
    video_url: normalizeMediaUrl(req, row.video_url),
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

router.get('/cases', async (req, res) => {
  try {
    const rows = await all(
      `SELECT *
      FROM festival_cases
      WHERE status = 'published'
      ORDER BY sort_order DESC, created_at DESC`
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

router.get('/cases/:id', async (req, res) => {
  try {
    const row = await get(
      `SELECT *
      FROM festival_cases
      WHERE id = ? AND status = 'published'`,
      [req.params.id]
    );

    if (!row) {
      res.status(404).json({
        success: false,
        message: 'Festival case not found'
      });
      return;
    }

    res.json({
      success: true,
      data: mapFestivalCase(req, row)
    });
  } catch (error) {
    console.error('Failed to get festival case:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get festival case'
    });
  }
});

router.post('/leads', async (req, res) => {
  const contactName = normalizeText(req.body.contact_name);
  const phone = normalizeText(req.body.phone);

  if (!contactName || !phone) {
    res.status(400).json({
      success: false,
      message: '联系人和手机号不能为空'
    });
    return;
  }

  if (!/^1\d{10}$/.test(phone)) {
    res.status(400).json({
      success: false,
      message: '请填写正确手机号'
    });
    return;
  }

  try {
    const result = await run(
      `INSERT INTO festival_leads (
        contact_name,
        phone,
        company,
        city,
        event_date,
        cooperation_type,
        requirement,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        contactName,
        phone,
        normalizeText(req.body.company),
        normalizeText(req.body.city),
        normalizeText(req.body.event_date),
        normalizeText(req.body.cooperation_type),
        normalizeText(req.body.requirement)
      ]
    );

    res.status(201).json({
      success: true,
      message: '合作意向已提交',
      data: {
        id: result.id,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Failed to create festival lead:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit festival lead'
    });
  }
});

module.exports = router;
