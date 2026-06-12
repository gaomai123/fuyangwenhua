const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const statusLabelMap = {
  pending: '待处理',
  contacted: '已联系',
  closed: '已关闭'
};

function normalizeBooking(booking) {
  return {
    ...booking,
    id: booking._id,
    status_label: statusLabelMap[booking.status] || booking.status || '-'
  };
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    const result = await db
      .collection('bookings')
      .where({
        customer_openid: wxContext.OPENID
      })
      .limit(100)
      .get();

    return {
      success: true,
      data: result.data.map(normalizeBooking)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取预约状态失败'
    };
  }
};
