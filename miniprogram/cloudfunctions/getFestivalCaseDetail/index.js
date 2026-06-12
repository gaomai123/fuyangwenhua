const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event) => {
  const id = String(event.id || '').trim();

  if (!id) {
    return {
      success: false,
      message: '缺少案例 ID'
    };
  }

  try {
    const result = await db.collection('festival_cases').doc(id).get();
    const item = result.data;

    if (!item || item.status !== 'published') {
      return {
        success: false,
        message: '案例不存在或已隐藏'
      };
    }

    return {
      success: true,
      data: {
        ...item,
        id: item._id,
        image: item.cover_url || item.image || '',
        desc: item.summary || item.desc || ''
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取案例详情失败'
    };
  }
};
