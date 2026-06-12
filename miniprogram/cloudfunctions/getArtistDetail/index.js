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

function firstMediaValue() {
  for (let index = 0; index < arguments.length; index += 1) {
    const value = arguments[index];

    if (Array.isArray(value) && value.length) {
      return value;
    }

    if (!Array.isArray(value) && value) {
      return value;
    }
  }

  return '';
}

function isArtistBookable(artist) {
  return artist.can_book !== false && !['on_duty', 'paused'].includes(artist.work_status);
}

function normalizeArtist(artist) {
  return {
    id: artist._id,
    stage_name: artist.stage_name || '',
    city: artist.city || '',
    dispatch_cities: artist.dispatch_cities || '',
    category: artist.category || '',
    tags: normalizeTags(artist.tags),
    gender: artist.gender || '',
    age: artist.age || '',
    height: artist.height || '',
    singing_type: artist.singing_type || '',
    price: artist.price || '',
    salary_display: artist.salary_display || artist.price || '',
    bio: artist.bio || '',
    work_status: artist.work_status || 'available',
    can_book: isArtistBookable(artist),
    avatar_url: artist.avatar_url || artist.avatar_file_id || '',
    photo_urls: joinFileIds(artist.photo_file_ids || artist.photo_urls),
    art_photo_urls: joinFileIds(artist.art_photo_file_ids || artist.art_photo_urls || artist.photo_file_ids),
    life_photo_urls: joinFileIds(artist.life_photo_file_ids || artist.life_photo_urls),
    video_urls: joinFileIds(firstMediaValue(artist.video_file_ids, artist.video_file_id, artist.video_url)),
    video_url: joinFileIds(firstMediaValue(artist.video_file_ids, artist.video_file_id, artist.video_url))
  };
}

exports.main = async (event) => {
  const id = event.id;

  if (!id) {
    return {
      success: false,
      message: '缺少艺人 ID'
    };
  }

  try {
    const result = await db.collection('artists').doc(id).get();
    const artist = result.data;

    if (!artist || artist.status !== 'approved' || artist.is_hidden === true) {
      return {
        success: false,
        message: '没有找到艺人资料'
      };
    }

    return {
      success: true,
      data: normalizeArtist(artist)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取艺人详情失败'
    };
  }
};
