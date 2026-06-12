function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    if (!wx.cloud) {
      reject(new Error('当前基础库不支持云开发，请在微信开发者工具中开启云开发'));
      return;
    }

    wx.cloud.callFunction({
      name,
      data,
      success(response) {
        const result = response.result || {};

        if (result.success) {
          resolve(result);
          return;
        }

        reject(new Error(result.message || '云函数调用失败'));
      },
      fail(error) {
        reject(new Error(error.errMsg || '云函数调用失败'));
      }
    });
  });
}

let unreadCountCache = null;
let userAccountPromise = null;

function ensureUserAccount() {
  if (!userAccountPromise) {
    userAccountPromise = callFunction('userProfile', {
      action: 'get'
    }).catch((error) => {
      userAccountPromise = null;
      throw error;
    });
  }

  return userAccountPromise;
}

function getArtists(filters = {}) {
  return callFunction('getArtists', { filters });
}

function getArtistDetail(id) {
  return callFunction('getArtistDetail', { id });
}

function submitArtist(profile) {
  return ensureUserAccount().then(() => callFunction('submitArtist', { profile }));
}

function getMySubmissions() {
  return ensureUserAccount().then(() => callFunction('getMySubmissions'));
}

function submitBooking(booking) {
  return ensureUserAccount().then(() => callFunction('submitBooking', { booking }));
}

function getMyBookings() {
  return ensureUserAccount().then(() => callFunction('getMyBookings'));
}

function getMyFestivalLeads() {
  return ensureUserAccount().then(() => callFunction('getMyFestivalLeads'));
}

function submitFestivalLead(lead) {
  return ensureUserAccount().then(() => callFunction('submitFestivalLead', { lead }));
}

function submitPromotionApplication(application) {
  return ensureUserAccount().then(() => callFunction('submitPromotionApplication', { application }));
}

function getMyPromotionApplications() {
  return ensureUserAccount().then(() => callFunction('getMyPromotionApplications'));
}

function getFestivalCases() {
  return callFunction('getFestivalCases');
}

function getFestivalCaseDetail(id) {
  return callFunction('getFestivalCaseDetail', { id });
}

function getNewsList(category = '') {
  return callFunction('getNewsList', { category });
}

function getNewsDetail(id) {
  return callFunction('getNewsDetail', { id });
}

function getProducts(category = '') {
  return callFunction('getProducts', { category });
}

function getProductDetail(id) {
  return callFunction('getProductDetail', { id });
}

function getMyNotifications() {
  return ensureUserAccount().then(() => callFunction('getMyNotifications'));
}

function getUnreadNotificationCount() {
  const now = Date.now();

  if (unreadCountCache && now - unreadCountCache.time < 8000) {
    return Promise.resolve(unreadCountCache.result);
  }

  return callFunction('getUnreadNotificationCount').then((result) => {
    unreadCountCache = {
      time: Date.now(),
      result
    };

    return result;
  });
}

function markNotificationRead(id) {
  unreadCountCache = null;
  return ensureUserAccount().then(() => callFunction('markNotificationRead', { id }));
}

function markAllNotificationsRead() {
  unreadCountCache = null;
  return ensureUserAccount().then(() => callFunction('markAllNotificationsRead'));
}

function deleteNotification(id) {
  unreadCountCache = null;
  return ensureUserAccount().then(() => callFunction('deleteNotification', { id }));
}

function getMyArtistProfile() {
  return ensureUserAccount().then(() => callFunction('getMyArtistProfile'));
}

function updateMyArtistStatus(workStatus) {
  return ensureUserAccount().then(() => callFunction('updateMyArtistStatus', {
    work_status: workStatus
  }));
}

function getUserProfile() {
  return ensureUserAccount();
}

function saveUserProfile(profile) {
  return callFunction('userProfile', {
    action: 'save',
    profile
  }).then((result) => {
    userAccountPromise = Promise.resolve(result);
    return result;
  });
}

module.exports = {
  callFunction,
  getArtists,
  getArtistDetail,
  submitArtist,
  getMySubmissions,
  submitBooking,
  getMyBookings,
  getMyFestivalLeads,
  submitFestivalLead,
  submitPromotionApplication,
  getMyPromotionApplications,
  getFestivalCases,
  getFestivalCaseDetail,
  getNewsList,
  getNewsDetail,
  getProducts,
  getProductDetail,
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getMyArtistProfile,
  updateMyArtistStatus,
  ensureUserAccount,
  getUserProfile,
  saveUserProfile
};
