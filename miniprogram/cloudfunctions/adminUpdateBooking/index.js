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

async function getBooking(id) {
  const result = await db.collection('bookings').doc(id).get();

  if (!result.data) {
    throw new Error('预约记录不存在');
  }

  return result.data;
}

function buildNotification(booking, status) {
  const artistName = booking.artist_name || '艺人';
  const statusLabel = statusLabelMap[status] || status;

  return {
    openid: booking.customer_openid,
    title: '预约状态已更新',
    content: `你预约的 ${artistName} 当前状态为：${statusLabel}。`,
    type: 'booking',
    read: false,
    created_at: db.serverDate()
  };
}

async function markArtistOnDuty(booking) {
  if (!booking.artist_id) {
    return;
  }

  await db.collection('artists').doc(booking.artist_id).update({
    data: {
      work_status: 'on_duty',
      can_book: false,
      updated_at: db.serverDate()
    }
  });
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const id = event.id;
  const status = event.status;

  if (!id) {
    return {
      success: false,
      message: '缺少预约 ID'
    };
  }

  if (!['pending', 'contacted', 'closed'].includes(status)) {
    return {
      success: false,
      message: '预约状态不正确'
    };
  }

  try {
    await assertAdmin(wxContext.OPENID);
    const booking = await getBooking(id);

    await db.collection('bookings').doc(id).update({
      data: {
        status,
        updated_at: db.serverDate()
      }
    });

    if (status === 'contacted' && booking.status !== status) {
      await markArtistOnDuty(booking);
    }

    if (booking.customer_openid && booking.status !== status) {
      await db.collection('notifications').add({
        data: buildNotification(booking, status)
      });
    }

    return {
      success: true,
      data: {
        id,
        status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '更新预约状态失败'
    };
  }
};
