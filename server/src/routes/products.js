const express = require('express');
const { all, get } = require('../db/database');

const router = express.Router();

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getBaseUrl(req) {
  return `${req.protocol}://${req.get('host')}`;
}

function normalizeMediaUrl(req, value) {
  const text = normalizeText(value);

  if (!text) {
    return '';
  }

  if (text.startsWith('/uploads/') || text.startsWith('/images/')) {
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

function mapProduct(req, row, includeDetail = false) {
  const product = {
    id: row.id,
    name: row.name,
    category: row.category,
    cover_url: normalizeMediaUrl(req, row.cover_url),
    summary: row.summary,
    price_text: '批发价联系我们',
    status: row.status,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

  if (includeDetail) {
    product.image_urls = normalizeMediaList(req, row.image_urls);
    product.specs = row.specs;
    product.detail = row.detail;
    product.contact_wechat = row.contact_wechat;
    product.contact_phone = row.contact_phone;
  }

  return product;
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
      FROM wholesale_products
      WHERE ${where.join(' AND ')}
      ORDER BY sort_order DESC, created_at DESC`,
      params
    );

    res.json({
      success: true,
      data: rows.map((row) => mapProduct(req, row))
    });
  } catch (error) {
    console.error('Failed to list wholesale products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list wholesale products'
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const rows = await all(
      `SELECT DISTINCT category
      FROM wholesale_products
      WHERE status = ? AND category != ''
      ORDER BY category ASC`,
      ['published']
    );

    res.json({
      success: true,
      data: rows.map((row) => row.category)
    });
  } catch (error) {
    console.error('Failed to list product categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list product categories'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await get(
      `SELECT *
      FROM wholesale_products
      WHERE id = ? AND status = ?`,
      [req.params.id, 'published']
    );

    if (!row) {
      res.status(404).json({
        success: false,
        message: 'Product not found'
      });
      return;
    }

    res.json({
      success: true,
      data: mapProduct(req, row, true)
    });
  } catch (error) {
    console.error('Failed to get wholesale product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wholesale product'
    });
  }
});

module.exports = router;
