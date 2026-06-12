const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function cleanString(value) {
  return String(value || '').trim();
}

function normalizeProfile(profile) {
  return {
    id: profile._id,
    nickname: profile.nickname || '微信用户',
    avatar_url: profile.avatar_url || '',
    profile_completed: Boolean(profile.nickname || profile.avatar_url),
    created_at: profile.created_at,
    updated_at: profile.updated_at
  };
}

async function getOrCreateProfile(openid) {
  const result = await db.collection('user_profiles')
    .where({ openid })
    .limit(1)
    .get();

  if (result.data.length) {
    return result.data[0];
  }

  const data = {
    openid,
    nickname: '',
    avatar_url: '',
    role: 'user',
    created_at: db.serverDate(),
    updated_at: db.serverDate()
  };
  const created = await db.collection('user_profiles').add({ data });

  return {
    ...data,
    _id: created._id
  };
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();

  if (!wxContext.OPENID) {
    return {
      success: false,
      message: '未获取到微信身份'
    };
  }

  try {
    const profile = await getOrCreateProfile(wxContext.OPENID);

    if (event.action === 'save') {
      const nickname = cleanString(event.profile && event.profile.nickname);
      const avatarUrl = cleanString(event.profile && event.profile.avatar_url);

      if (!nickname) {
        return {
          success: false,
          message: '请填写微信昵称'
        };
      }

      await db.collection('user_profiles').doc(profile._id).update({
        data: {
          nickname: nickname.slice(0, 30),
          avatar_url: avatarUrl,
          updated_at: db.serverDate()
        }
      });

      return {
        success: true,
        data: normalizeProfile({
          ...profile,
          nickname: nickname.slice(0, 30),
          avatar_url: avatarUrl
        })
      };
    }

    return {
      success: true,
      data: normalizeProfile(profile)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '微信登录失败'
    };
  }
};
