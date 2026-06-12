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

async function countByStatus(collection, status) {
  const result = await db
    .collection(collection)
    .where({ status })
    .count();

  return result.total || 0;
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    await assertAdmin(wxContext.OPENID);

    const [pendingArtists, pendingBookings, pendingFestivalLeads, publishedNews] = await Promise.all([
      countByStatus('artists', 'pending'),
      countByStatus('bookings', 'pending'),
      countByStatus('festival_leads', 'pending'),
      countByStatus('news', 'published')
    ]);

    return {
      success: true,
      data: {
        pending_artists: pendingArtists,
        pending_bookings: pendingBookings,
        pending_festival_leads: pendingFestivalLeads,
        published_news: publishedNews
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取后台统计失败'
    };
  }
};
