const { getMyFestivalLeads, getUnreadNotificationCount } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

const statusSteps = [
  { code: 'pending', label: '待处理' },
  { code: 'contacted', label: '已联系' },
  { code: 'closed', label: '已关闭' }
];

Page({
  data: {
    loading: false,
    leads: [],
    statusSteps,
    unreadNotificationCount: 0,
    unreadNotificationText: ''
  },

  onShow() {
    this.loadLeads();
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

  normalizeLead(item) {
    return {
      ...item,
      display_date: this.formatDate(item.created_at),
      display_updated: this.formatDate(item.updated_at)
    };
  },

  async loadLeads() {
    this.setData({ loading: true });

    try {
      const result = await getMyFestivalLeads();
      const leads = (result.data || [])
        .map((item) => this.normalizeLead(item))
        .sort((a, b) => this.getTimeValue(b.created_at) - this.getTimeValue(a.created_at));

      this.setData({ leads });
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

  goFestival() {
    wx.navigateTo({
      url: '/pages/festival/festival',
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  goNav(event) {
    goNavTarget(event.currentTarget.dataset.target);
  }
});
