const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const allowedFields = [
  'stage_name',
  'real_name',
  'phone',
  'city',
  'dispatch_cities',
  'category',
  'tags',
  'height',
  'age',
  'gender',
  'singing_type',
  'price',
  'bio',
  'video_url',
  'avatar_file_id',
  'photo_file_ids',
  'video_file_id',
  'video_file_ids'
];

const requiredFields = ['stage_name', 'real_name', 'phone', 'city', 'category'];

function cleanString(value) {
  return String(value || '').trim();
}

function normalizeTags(value, category) {
  const raw = Array.isArray(value) ? value : cleanString(value).split(',');
  const tags = raw.map((item) => cleanString(item)).filter(Boolean);

  if (category && !tags.includes(category)) {
    tags.unshift(category);
  }

  return tags;
}

function pickProfile(profile) {
  return allowedFields.reduce((data, field) => {
    if (profile[field] !== undefined) {
      data[field] = profile[field];
    }

    return data;
  }, {});
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const profile = event.profile || {};

  for (let index = 0; index < requiredFields.length; index += 1) {
    const field = requiredFields[index];

    if (!cleanString(profile[field])) {
      return {
        success: false,
        message: '请填写完整资料'
      };
    }
  }

  const data = pickProfile(profile);
  const category = cleanString(data.category);

  data.openid = wxContext.OPENID;
  data.stage_name = cleanString(data.stage_name);
  data.real_name = cleanString(data.real_name);
  data.phone = cleanString(data.phone);
  data.city = cleanString(data.city);
  data.dispatch_cities = cleanString(data.dispatch_cities);
  data.category = category;
  data.tags = normalizeTags(data.tags, category);
  data.gender = cleanString(data.gender);
  data.singing_type = cleanString(data.singing_type);
  data.height = cleanString(data.height);
  data.age = cleanString(data.age);
  data.price = cleanString(data.price);
  data.bio = cleanString(data.bio);
  data.video_url = cleanString(data.video_url);
  data.avatar_file_id = cleanString(data.avatar_file_id);
  data.video_file_id = cleanString(data.video_file_id);
  data.video_file_ids = Array.isArray(data.video_file_ids) ? data.video_file_ids : [];
  data.photo_file_ids = Array.isArray(data.photo_file_ids) ? data.photo_file_ids : [];
  data.status = 'pending';
  data.can_book = true;
  data.reject_reason = '';
  data.created_at = db.serverDate();
  data.updated_at = db.serverDate();

  try {
    const result = await db.collection('artists').add({
      data
    });

    return {
      success: true,
      data: {
        id: result._id,
        status: data.status
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '提交艺人资料失败'
    };
  }
};
