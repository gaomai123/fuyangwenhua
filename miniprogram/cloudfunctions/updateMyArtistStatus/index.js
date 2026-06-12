const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const allowedStatuses = ['available', 'on_duty', 'paused'];

function getCanBook(workStatus) {
  return workStatus === 'available';
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const workStatus = String(event.work_status || '').trim();

  if (!allowedStatuses.includes(workStatus)) {
    return {
      success: false,
      message: '艺人状态不正确'
    };
  }

  try {
    const result = await db
      .collection('artists')
      .where({
        openid: wxContext.OPENID,
        status: 'approved'
      })
      .limit(1)
      .get();

    if (!result.data.length) {
      return {
        success: false,
        message: '暂未找到可更新的艺人档案'
      };
    }

    const artist = result.data[0];

    await db.collection('artists').doc(artist._id).update({
      data: {
        work_status: workStatus,
        can_book: getCanBook(workStatus),
        updated_at: db.serverDate()
      }
    });

    return {
      success: true,
      data: {
        id: artist._id,
        work_status: workStatus,
        can_book: getCanBook(workStatus)
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '更新艺人状态失败'
    };
  }
};
