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

  if (!id) {
    return {
      success: false,
      message: '缺少案例 ID'
    };
  }

  try {
    await assertAdmin(wxContext.OPENID);
    await db.collection('festival_cases').doc(id).remove();

    return {
      success: true,
      data: { id }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '删除案例失败'
    };
  }
};
