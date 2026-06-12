const { getMyPromotionApplications } = require('../../utils/cloud');

Page({
  data: {
    loading: false,
    applications: []
  },

  onShow() {
    this.loadApplications();
  },

  formatDate(value) {
    if (!value) return '';
    if (value instanceof Date) {
      return `${value.getFullYear()}-${value.getMonth() + 1}-${value.getDate()} ${value.getHours()}:${String(value.getMinutes()).padStart(2, '0')}`;
    }
    return String(value).slice(0, 16).replace('T', ' ');
  },

  getTimeValue(value) {
    const parsed = new Date(value || 0).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  },

  async loadApplications() {
    this.setData({ loading: true });
    try {
      const result = await getMyPromotionApplications();
      const applications = (result.data || [])
        .map((item) => ({
          ...item,
          display_date: this.formatDate(item.created_at),
          display_updated: this.formatDate(item.updated_at)
        }))
        .sort((a, b) => this.getTimeValue(b.created_at) - this.getTimeValue(a.created_at));
      this.setData({ applications });
    } catch (error) {
      wx.showToast({ title: error.message || '读取失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  goPromotion() {
    wx.navigateTo({ url: '/pages/promotion/promotion' });
  }
});
