const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event = {}) => {
  const id = String(event.id || '').trim();

  if (!id) {
    return {
      success: false,
      message: '缺少产品 ID'
    };
  }

  try {
    const result = await db.collection('wholesale_products').doc(id).get();
    const item = result.data;

    if (!item || item.status !== 'published') {
      return {
        success: false,
        message: '产品不存在或已下架'
      };
    }

    return {
      success: true,
      data: {
        ...item,
        id: item._id,
        price_text: item.price_text || '批发价联系我们'
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取产品详情失败'
    };
  }
};
