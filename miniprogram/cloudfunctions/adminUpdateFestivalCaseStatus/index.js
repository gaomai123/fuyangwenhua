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

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const id = String(event.id || '').trim();
  const status = event.status;

  if (!id || !['draft', 'published', 'hidden'].includes(status)) {
    return {
      success: false,
      message: '案例 ID 或状态不正确'
    };
  }

  try {
    await assertAdmin(wxContext.OPENID);

    await db.collection('festival_cases').doc(id).update({
      data: {
        status,
        updated_at: db.serverDate()
      }
    });

    return {
      success: true,
      data: { id, status }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '更新案例状态失败'
    };
  }
};
