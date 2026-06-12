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

async function getLead(id) {
  const result = await db.collection('festival_leads').doc(id).get();

  if (!result.data) {
    throw new Error('合作意向不存在');
  }

  return result.data;
}

function buildNotification(lead, status) {
  const cooperationType = lead.cooperation_type || '音乐节合作';
  const statusLabel = statusLabelMap[status] || status;

  return {
    openid: lead.openid,
    title: '音乐节合作申请已处理',
    content: `你提交的${cooperationType}申请当前状态为：${statusLabel}。`,
    type: 'festival',
    read: false,
    created_at: db.serverDate()
  };
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const id = event.id;
  const status = event.status;

  if (!id) {
    return {
      success: false,
      message: '缺少合作意向 ID'
    };
  }

  if (!['pending', 'contacted', 'closed'].includes(status)) {
    return {
      success: false,
      message: '合作意向状态不正确'
    };
  }

  try {
    await assertAdmin(wxContext.OPENID);
    const lead = await getLead(id);

    await db.collection('festival_leads').doc(id).update({
      data: {
        status,
        updated_at: db.serverDate()
      }
    });

    if (lead.openid && lead.status !== status) {
      await db.collection('notifications').add({
        data: buildNotification(lead, status)
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
      message: error.message || '更新合作意向失败'
    };
  }
};
