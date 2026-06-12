const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    const result = await db
      .collection('notifications')
      .where({
        openid: wxContext.OPENID,
        read: _.neq(true)
      })
      .update({
        data: {
          read: true,
          read_at: db.serverDate()
        }
      });

    return {
      success: true,
      data: {
        updated: (result.stats && result.stats.updated) || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '全部标为已读失败'
    };
  }
};
