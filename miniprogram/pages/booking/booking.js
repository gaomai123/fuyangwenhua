const { getUnreadNotificationCount, submitBooking } = require('../../utils/cloud');

const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    artistId: '',
    artistName: '',
    submitting: false,
    unreadNotificationCount: 0,
    unreadNotificationText: ''
  },

  onLoad(options) {
    this.setData({
      artistId: options.id || '',
      artistName: decodeURIComponent(options.name || '艺人')
    });
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

  validate(values) {
    if (!String(values.contact_name || '').trim()) {
      wx.showToast({ title: '请填写联系人', icon: 'none' });
      return false;
    }

    if (!/^1\d{10}$/.test(String(values.phone || '').trim())) {
      wx.showToast({ title: '请填写正确手机号', icon: 'none' });
      return false;
    }

    return true;
  },

  async submitBooking(event) {
    const values = event.detail.value;

    if (!this.validate(values) || !this.data.artistId) {
      return;
    }

    this.setData({ submitting: true });

    try {
      await submitBooking({
        ...values,
        artist_id: this.data.artistId,
        artist_name: this.data.artistName
      });

      wx.redirectTo({
        url: '/pages/success/success?type=booking'
      });
    } catch (error) {
      wx.showModal({
        title: '提交失败',
        content: error.message,
        showCancel: false
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goNav(event) {
    const target = event.currentTarget.dataset.target;
    goNavTarget(target);
  }
});
