const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

async function findAdmin(openid) {
  const result = await db
    .collection('admins')
    .where({
      openid,
      role: 'admin',
      enabled: true
    })
    .limit(1)
    .get();

  return result.data[0] || null;
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const admin = await findAdmin(wxContext.OPENID);

  return {
    success: true,
    data: {
      openid: wxContext.OPENID,
      is_admin: Boolean(admin),
      name: admin ? admin.name || '管理员' : ''
    }
  };
};
