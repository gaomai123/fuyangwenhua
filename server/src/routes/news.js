const express = require('express');
const { all, get } = require('../db/database');

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

function normalizeMediaList(req, value) {
  return String(value || '')
    .split(',')
    .map((item) => normalizeMediaUrl(req, item))
    .filter(Boolean)
    .join(',');
}

function mapNewsPost(req, row, includeContent = false) {
  const post = {
    id: row.id,
    title: row.title,
    category: row.category,
    cover_url: normalizeMediaUrl(req, row.cover_url),
    summary: row.summary,
    is_top: row.is_top,
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

  if (includeContent) {
    post.content = row.content;
    post.image_urls = normalizeMediaList(req, row.image_urls);
    post.video_url = normalizeMediaUrl(req, row.video_url);
  }

  return post;
}

router.get('/', async (req, res) => {
  const category = normalizeText(req.query.category);
  const params = ['published'];
  const where = ['status = ?'];

  if (category) {
    where.push('category = ?');
    params.push(category);
  }

  try {
    const rows = await all(
      `SELECT *
      FROM news_posts
      WHERE ${where.join(' AND ')}
      ORDER BY is_top DESC, sort_order DESC, created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map((row) => mapNewsPost(req, row))
    });
  } catch (error) {
    console.error('Failed to list news posts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list news posts'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await get(
      `SELECT *
      FROM news_posts
      WHERE id = ? AND status = ?`,
      [req.params.id, 'published']
    );

    if (!row) {
      res.status(404).json({
        success: false,
        message: 'News post not found'
      });
      return;
    }

    res.json({
      success: true,
      data: mapNewsPost(req, row, true)
    });
  } catch (error) {
    console.error('Failed to get news post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news post'
    });
  }
});

module.exports = router;
