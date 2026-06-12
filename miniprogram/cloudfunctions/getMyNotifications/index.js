const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeNotification(item) {
  return {
    ...item,
    id: item._id,
    read: Boolean(item.read)
  };
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    const result = await db
      .collection('notifications')
      .where({
        openid: wxContext.OPENID
      })
      .orderBy('created_at', 'desc')
      .limit(30)
      .get();

    return {
      success: true,
      data: result.data.map(normalizeNotification)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取消息失败'
    };
  }
};
