const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeCase(item) {
  return {
    ...item,
    id: item._id,
    image: item.cover_url || item.image || '',
    desc: item.summary || item.desc || ''
  };
}

exports.main = async () => {
  try {
    const result = await db
      .collection('festival_cases')
      .where({
        status: 'published'
      })
      .orderBy('sort_order', 'desc')
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    return {
      success: true,
      data: result.data.map(normalizeCase)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取案例失败'
    };
  }
};
