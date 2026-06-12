const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

async function assertAdmin(openid) {
  const result = await db
    .collection('admins')
    .where({
      openid,
      role: 'admin',
      enabled: true
    })
    .limit(1)
    .get();

  if (!result.data.length) {
    throw new Error('无管理员权限');
  }
}

function normalizeBooking(booking) {
  return {
    ...booking,
    id: booking._id
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
  const wxContext = cloud.getWXContext();
  const status = event.status || 'pending';
  const where = {};

  if (status) {
    where.status = status;
  }

  try {
    await assertAdmin(wxContext.OPENID);

    const result = await db
      .collection('bookings')
      .where(where)
      .limit(100)
      .get();

    return {
      success: true,
      data: result.data
        .map(normalizeBooking)
        .sort((a, b) => getTimeValue(b.created_at) - getTimeValue(a.created_at))
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取预约列表失败'
    };
  }
};
