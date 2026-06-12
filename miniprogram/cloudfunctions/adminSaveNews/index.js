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

function cleanString(value) {
  return String(value || '').trim();
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const news = event.news || {};
  const id = cleanString(news.id);
  const data = {
    title: cleanString(news.title),
    category: cleanString(news.category) || '平台公告',
    summary: cleanString(news.summary),
    content: cleanString(news.content),
    cover_url: cleanString(news.cover_url),
    image_urls: cleanString(news.image_urls),
    video_url: cleanString(news.video_url),
    status: ['draft', 'published', 'hidden'].includes(news.status) ? news.status : 'draft',
    is_top: Boolean(news.is_top),
    sort_order: Number(news.sort_order || 0),
    updated_at: db.serverDate()
  };

  if (!data.title) {
    return {
      success: false,
      message: '请填写标题'
    };
  }

  try {
    await assertAdmin(wxContext.OPENID);

    if (id) {
      await db.collection('news').doc(id).update({ data });
      return {
        success: true,
        data: { id }
      };
    }

    data.created_at = db.serverDate();

    const result = await db.collection('news').add({ data });

    return {
      success: true,
      data: { id: result._id }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '保存动态公告失败'
    };
  }
};
