const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    const result = await db
      .collection('notifications')
      .where({
        openid: wxContext.OPENID,
        read: false
      })
      .count();

    return {
      success: true,
      data: {
        count: result.total || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取未读消息失败'
    };
  }
};
