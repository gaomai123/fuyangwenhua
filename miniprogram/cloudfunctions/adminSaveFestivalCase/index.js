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
    throw new Error('无管理员权限，请先在 admins 集合添加当前 openid');
  }
}

function cleanString(value) {
  return String(value || '').trim();
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const input = event.caseData || {};
  const id = cleanString(input.id);
  const data = {
    title: cleanString(input.title),
    location: cleanString(input.location),
    tag: cleanString(input.tag),
    cover_url: cleanString(input.cover_url || input.image),
    video_url: cleanString(input.video_url),
    summary: cleanString(input.summary || input.desc),
    detail: cleanString(input.detail),
    status: ['draft', 'published', 'hidden'].includes(input.status) ? input.status : 'published',
    sort_order: Number(input.sort_order || 0),
    updated_at: db.serverDate()
  };

  if (!data.title || !data.location) {
    return {
      success: false,
      message: '请填写音乐节名称和地址'
    };
  }

  try {
    await assertAdmin(wxContext.OPENID);

    if (id) {
      await db.collection('festival_cases').doc(id).update({ data });
      return {
        success: true,
        data: { id }
      };
    }

    data.created_at = db.serverDate();
    const result = await db.collection('festival_cases').add({ data });

    return {
      success: true,
      data: { id: result._id }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '保存案例失败，请确认 festival_cases 集合已创建'
    };
  }
};
