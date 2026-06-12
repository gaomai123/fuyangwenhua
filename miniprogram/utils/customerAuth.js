const { request } = require('./request');

const TOKEN_KEY = 'customer_token';
const CUSTOMER_KEY = 'customer_profile';

function getToken() {
  return wx.getStorageSync(TOKEN_KEY) || '';
}

function getCustomer() {
  return wx.getStorageSync(CUSTOMER_KEY) || null;
}

function setSession(data) {
  wx.setStorageSync(TOKEN_KEY, data.token);
  wx.setStorageSync(CUSTOMER_KEY, data.customer);
}

function clearSession() {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(CUSTOMER_KEY);
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(result) {
        if (result.code) {
          resolve(result.code);
          return;
        }

        reject(new Error('微信登录失败'));
      },
      fail(error) {
        reject(new Error(error.errMsg || '微信登录失败'));
      }
    });
  });
}

async function loginWithWechat(profile = {}) {
  const code = await wxLogin();
  const result = await request({
    url: '/auth/wechat-login',
    method: 'POST',
    data: {
      code,
      nickname: profile.nickname || '',
      avatar_url: profile.avatar_url || ''
    }
  });

  setSession(result.data);
  return result.data;
}

async function ensureLogin() {
  const token = getToken();

  if (token) {
    return token;
  }

  const session = await loginWithWechat();
  return session.token;
}

module.exports = {
  clearSession,
  ensureLogin,
  getCustomer,
  getToken,
  loginWithWechat
};
