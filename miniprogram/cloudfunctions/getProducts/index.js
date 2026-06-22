const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeProduct(item) {
  return {
    ...item,
    id: item._id,
    price_text: item.price_text || '批发价联系我们'
  };
}

function getTimeValue(value) {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

exports.main = async (event = {}) => {
  const category = String(event.category || '').trim();
  const where = {
    status: 'published'
  };

  if (category) {
    where.category = category;
  }

  try {
    const result = await db
      .collection('wholesale_products')
      .where(where)
      .limit(200)
      .get();

    const data = result.data
      .map(normalizeProduct)
      .sort((a, b) => {
        const sortDiff = Number(b.sort_order || 0) - Number(a.sort_order || 0);

        if (sortDiff !== 0) {
          return sortDiff;
        }

        return getTimeValue(b.created_at) - getTimeValue(a.created_at);
      });

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取产品失败'
    };
  }
};
