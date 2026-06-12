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
  const status = String(event.status || '').trim();
  const where = {};

  if (status) {
    where.status = status;
  }

  try {
    await assertAdmin(wxContext.OPENID);

    const result = await db.collection('festival_cases').where(where).limit(100).get();
    const data = result.data
      .map((item) => ({
        ...item,
        id: item._id,
        image: item.cover_url || item.image || '',
        desc: item.summary || item.desc || ''
      }))
      .sort((a, b) => Number(b.sort_order || 0) - Number(a.sort_order || 0));

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取案例失败'
    };
  }
};
