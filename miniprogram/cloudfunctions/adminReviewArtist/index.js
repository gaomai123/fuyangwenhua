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

async function getArtist(id) {
  const result = await db.collection('artists').doc(id).get();

  if (!result.data) {
    throw new Error('艺人资料不存在');
  }

  return result.data;
}

function buildNotification(artist, status, reason) {
  const stageName = artist.stage_name || artist.real_name || '你的艺人资料';

  if (status === 'approved') {
    return {
      openid: artist.openid,
      title: '艺人资料审核通过',
      content: `${stageName} 已通过审核，现在可以在平台展示并接收预约。`,
      type: 'artist',
      read: false,
      created_at: db.serverDate()
    };
  }

  return {
    openid: artist.openid,
    title: '艺人资料审核未通过',
    content: `${stageName} 未通过审核，原因：${reason || '资料不完整'}。`,
    type: 'artist',
    read: false,
    created_at: db.serverDate()
  };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const id = event.id;
  const status = event.status;
  const reason = String(event.reason || '').trim();

  if (!id) {
    return {
      success: false,
      message: '缺少艺人 ID'
    };
  }

  if (!['approved', 'rejected'].includes(status)) {
    return {
      success: false,
      message: '审核状态不正确'
    };
  }

  try {
    await assertAdmin(wxContext.OPENID);
    const artist = await getArtist(id);

    const data = {
      status,
      reject_reason: status === 'rejected' ? reason || '资料不完整' : '',
      updated_at: db.serverDate()
    };

    if (status === 'approved') {
      data.approved_at = db.serverDate();
      data.work_status = 'available';
      data.is_hidden = false;
    }

    await db.collection('artists').doc(id).update({
      data
    });

    if (artist.openid) {
      await db.collection('notifications').add({
        data: buildNotification(artist, status, reason)
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
      message: error.message || '审核失败'
    };
  }
};
