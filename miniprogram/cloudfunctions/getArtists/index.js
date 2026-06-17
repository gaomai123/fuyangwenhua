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

function splitMedia(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isCloudFile(value) {
  return /^cloud:\/\//.test(String(value || '').trim());
}

function encodeMediaUrl(value) {
  const url = String(value || '').trim();

  if (!/^https?:\/\//.test(url)) {
    return url;
  }

  if (url.includes('/artist-import/20260617-second-batch/%')) {
    const parts = url.split('?');
    return encodeURI(parts[0].replace(/%/g, '%25')) + (parts[1] ? `?${parts.slice(1).join('?')}` : '');
  }

  try {
    return encodeURI(decodeURI(url));
  } catch (error) {
    return encodeURI(url);
  }
}

function isArtistBookable(artist) {
  return artist.can_book !== false && !['on_duty', 'paused'].includes(artist.work_status);
}

async function resolveMediaUrls(values) {
  const list = [...new Set(values.filter(isCloudFile))];

  if (!list.length) {
    return {};
  }

  const map = {};

  for (let index = 0; index < list.length; index += 50) {
    const result = await cloud.getTempFileURL({
      fileList: list.slice(index, index + 50)
    });

    (result.fileList || []).forEach((file) => {
      const fileID = file.fileID || file.fileid || file.cloudID || '';
      const tempUrl = encodeMediaUrl(file.tempFileURL || file.tempFileUrl || file.url || '');

      if (fileID && tempUrl) {
        map[fileID] = tempUrl;
      }
    });
  }

  return map;
}

function applyMediaMap(value, mediaMap) {
  return splitMedia(value).map((item) => mediaMap[item] || item).join(',');
}

function normalizeArtist(artist, mediaMap, options = {}) {
  const avatar = artist.avatar_url || artist.avatar_file_id || '';
  const photoUrls = Array.isArray(artist.photo_file_ids) ? artist.photo_file_ids.join(',') : artist.photo_urls || '';
  const artPhotoUrls = Array.isArray(artist.art_photo_file_ids)
    ? artist.art_photo_file_ids.join(',')
    : artist.art_photo_urls || '';
  const lifePhotoUrls = Array.isArray(artist.life_photo_file_ids)
    ? artist.life_photo_file_ids.join(',')
    : artist.life_photo_urls || '';

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
    avatar_url: mediaMap[avatar] || avatar,
    avatar_file_id: avatar,
    photo_urls: options.lightMedia ? photoUrls : applyMediaMap(photoUrls, mediaMap),
    photo_file_ids: photoUrls,
    art_photo_urls: options.lightMedia ? artPhotoUrls : applyMediaMap(artPhotoUrls, mediaMap),
    art_photo_file_ids: artPhotoUrls,
    life_photo_urls: options.lightMedia ? lifePhotoUrls : applyMediaMap(lifePhotoUrls, mediaMap),
    life_photo_file_ids: lifePhotoUrls
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
  const lightMedia = filters.light_media === true;
  const where = {
    status: 'approved',
    is_hidden: _.neq(true)
  };

  if (filters.featured_only) {
    where.is_featured_guest = true;
  }

  if (filters.city) {
    where.city = regExp(filters.city);
  }

  applyExactFilter(where, filters, 'gender');
  applyExactFilter(where, filters, 'singing_type');
  applyExactFilter(where, filters, 'category');

  if (filters.work_status) {
    where.work_status = filters.work_status;
  }

  let condition = where;

  if (filters.dispatch_city) {
    condition = _.and([
      condition,
      _.or([
        { dispatch_cities: regExp(filters.dispatch_city) },
        { dispatch_cities: regExp('\u5168\u56fd') }
      ])
    ]);
  }

  if (filters.keyword) {
    const keyword = filters.keyword;
    condition = _.and([
      condition,
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

    const mediaValues = [];
    result.data.forEach((artist) => {
      const avatar = artist.avatar_url || artist.avatar_file_id || '';
      const photos = Array.isArray(artist.photo_file_ids) ? artist.photo_file_ids : splitMedia(artist.photo_urls);
      const artPhotos = Array.isArray(artist.art_photo_file_ids) ? artist.art_photo_file_ids : splitMedia(artist.art_photo_urls);
      const lifePhotos = Array.isArray(artist.life_photo_file_ids) ? artist.life_photo_file_ids : splitMedia(artist.life_photo_urls);
      mediaValues.push(avatar);

      if (!lightMedia) {
        mediaValues.push(artPhotos[0] || photos[0] || lifePhotos[0] || '');
      }
    });

    const mediaMap = await resolveMediaUrls(mediaValues);

    return {
      success: true,
      data: result.data.map((artist) => normalizeArtist(artist, mediaMap, { lightMedia }))
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取艺人列表失败'
    };
  }
};
