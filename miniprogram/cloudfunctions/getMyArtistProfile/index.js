const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.join(',');
  }

  return tags || '';
}

function joinFileIds(value) {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  return value || '';
}

function normalizeArtist(artist) {
  return {
    ...artist,
    id: artist._id,
    review_status: artist.status,
    tags: normalizeTags(artist.tags),
    avatar_url: artist.avatar_url || artist.avatar_file_id || '',
    photo_urls: joinFileIds(artist.photo_file_ids || artist.photo_urls)
  };
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    const result = await db
      .collection('artists')
      .where({
        openid: wxContext.OPENID,
        status: 'approved'
      })
      .limit(1)
      .get();

    return {
      success: true,
      data: result.data.length ? normalizeArtist(result.data[0]) : null
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取我的艺人档案失败'
    };
  }
};
