const { getUnreadNotificationCount } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    unreadNotificationCount: 0,
    unreadNotificationText: ''
  },

  onShow() {
    this.loadUnreadNotificationCount();
  },

  async loadUnreadNotificationCount() {
    try {
      const result = await getUnreadNotificationCount();
      const count = Number((result.data || {}).count || 0);

      this.setData({
        unreadNotificationCount: count,
        unreadNotificationText: count > 99 ? '99+' : String(count)
      });
    } catch (error) {
      this.setData({
        unreadNotificationCount: 0,
        unreadNotificationText: ''
      });
    }
  },

  goSubmit() {
    wx.navigateTo({
      url: '/pages/submit/submit',
      fail() {
        wx.redirectTo({ url: '/pages/submit/submit' });
      }
    });
  },

  goFestival() {
    wx.navigateTo({ url: '/pages/festival/festival' });
  },

  goNav(event) {
    const target = event.currentTarget.dataset.target;
    goNavTarget(target);
  }
});
