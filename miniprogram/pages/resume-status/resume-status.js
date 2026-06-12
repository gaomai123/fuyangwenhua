const { getMySubmissions, getUnreadNotificationCount } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

const statusSteps = [
  { code: 'pending', label: '待审核' },
  { code: 'approved', label: '已通过' },
  { code: 'rejected', label: '已驳回' }
];

Page({
  data: {
    loading: false,
    submissions: [],
    statusSteps,
    unreadNotificationCount: 0,
    unreadNotificationText: ''
  },

  onShow() {
    this.loadSubmissions();
    this.loadUnreadNotificationCount();
  },

  formatDate(value) {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()} ${value.getHours()}:${String(value.getMinutes()).padStart(2, '0')}`;
    }

    return String(value).slice(0, 16).replace('T', ' ');
  },

  getTimeValue(value) {
    if (!value) {
      return 0;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  },

  normalizeSubmission(item) {
    return {
      ...item,
      display_date: this.formatDate(item.created_at),
      display_updated: this.formatDate(item.updated_at),
      display_type: item.identity_type || item.category || item.tags || '音乐人'
    };
  },

  async loadSubmissions() {
    this.setData({ loading: true });

    try {
      const result = await getMySubmissions();
      const submissions = (result.data || [])
        .map((item) => this.normalizeSubmission(item))
        .sort((a, b) => this.getTimeValue(b.created_at) - this.getTimeValue(a.created_at));

      this.setData({ submissions });
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
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
      animationType: 'slide-in-right',
      animationDuration: 220,
      fail() {
        wx.redirectTo({ url: '/pages/submit/submit' });
      }
    });
  },

  goNav(event) {
    goNavTarget(event.currentTarget.dataset.target);
  }
});
