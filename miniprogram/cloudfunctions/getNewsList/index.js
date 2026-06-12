const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizePost(post) {
  return {
    ...post,
    id: post._id
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

exports.main = async (event) => {
  const category = String(event.category || '').trim();
  const where = {
    status: 'published'
  };

  if (category) {
    where.category = category;
  }

  try {
    const result = await db
      .collection('news')
      .where(where)
      .orderBy('sort_order', 'desc')
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const data = result.data
      .map(normalizePost)
      .sort((a, b) => {
        const topDiff = Number(Boolean(b.is_top)) - Number(Boolean(a.is_top));

        if (topDiff !== 0) {
          return topDiff;
        }

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
      message: error.message || '读取动态失败'
    };
  }
};
