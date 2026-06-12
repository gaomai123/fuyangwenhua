const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const id = String(event.id || '').trim();

  if (!id) {
    return {
      success: false,
      message: '缺少消息 ID'
    };
  }

  try {
    const result = await db.collection('notifications').doc(id).get();
    const notification = result.data;

    if (!notification || notification.openid !== wxContext.OPENID) {
      return {
        success: false,
        message: '消息不存在'
      };
    }

    await db.collection('notifications').doc(id).update({
      data: {
        read: true,
        read_at: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        id
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '更新消息失败'
    };
  }
};
