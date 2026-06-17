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

function splitMedia(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinMedia(value) {
  return splitMedia(value).join(',');
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

async function normalizeArtist(artist) {
  const avatar = artist.avatar_url || artist.avatar_file_id || '';
  const photoUrls = joinFileIds(artist.photo_file_ids || artist.photo_urls);
  const artPhotoUrls = joinFileIds(artist.art_photo_file_ids || artist.art_photo_urls || artist.photo_file_ids);
  const lifePhotoUrls = joinFileIds(artist.life_photo_file_ids || artist.life_photo_urls);
  const videoUrls = joinFileIds(firstMediaValue(artist.video_file_ids, artist.video_file_id, artist.video_url));
  const mediaMap = await resolveMediaUrls([
    avatar,
    ...splitMedia(photoUrls),
    ...splitMedia(artPhotoUrls),
    ...splitMedia(lifePhotoUrls),
    ...splitMedia(videoUrls)
  ]);

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
    photo_urls: applyMediaMap(photoUrls, mediaMap),
    photo_file_ids: joinMedia(photoUrls),
    art_photo_urls: applyMediaMap(artPhotoUrls, mediaMap),
    art_photo_file_ids: joinMedia(artPhotoUrls),
    life_photo_urls: applyMediaMap(lifePhotoUrls, mediaMap),
    life_photo_file_ids: joinMedia(lifePhotoUrls),
    video_urls: applyMediaMap(videoUrls, mediaMap),
    video_url: applyMediaMap(videoUrls, mediaMap),
    video_file_ids: joinMedia(videoUrls)
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
      data: await normalizeArtist(artist)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取艺人详情失败'
    };
  }
};
