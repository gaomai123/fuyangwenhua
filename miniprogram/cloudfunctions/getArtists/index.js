const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.join(',');
  }

  return tags || '';
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
    photo_urls: Array.isArray(artist.photo_file_ids) ? artist.photo_file_ids.join(',') : artist.photo_urls || '',
    art_photo_urls: Array.isArray(artist.art_photo_file_ids)
      ? artist.art_photo_file_ids.join(',')
      : artist.art_photo_urls || '',
    life_photo_urls: Array.isArray(artist.life_photo_file_ids)
      ? artist.life_photo_file_ids.join(',')
      : artist.life_photo_urls || ''
  };
}

function applyExactFilter(where, filters, field) {
  if (filters[field]) {
    where[field] = filters[field];
  }
}

function regExp(value) {
  return db.RegExp({
    regexp: value,
    options: 'i'
  });
}

exports.main = async (event) => {
  const filters = event.filters || {};
  const requestedLimit = Number(filters.limit || 50);
  const limit = Math.max(1, Math.min(requestedLimit, 100));
  const where = {
    status: 'approved',
    is_hidden: _.neq(true)
  };

  if (filters.featured_only) {
    where.is_featured_guest = true;
  }

  applyExactFilter(where, filters, 'city');
  applyExactFilter(where, filters, 'gender');
  applyExactFilter(where, filters, 'singing_type');
  applyExactFilter(where, filters, 'category');

  if (filters.work_status) {
    where.work_status = filters.work_status;
  }

  if (filters.dispatch_city) {
    where.dispatch_cities = regExp(filters.dispatch_city);
  }

  let condition = where;

  if (filters.keyword) {
    const keyword = filters.keyword;
    condition = _.and([
      where,
      _.or([
        { stage_name: regExp(keyword) },
        { city: regExp(keyword) },
        { tags: regExp(keyword) },
        { bio: regExp(keyword) }
      ])
    ]);
  }

  try {
    const result = await db
      .collection('artists')
      .where(condition)
      .limit(limit)
      .get();

    return {
      success: true,
      data: result.data.map(normalizeArtist)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取艺人列表失败'
    };
  }
};
