const { getMyPromotionApplications } = require('../../utils/cloud');

Page({
  data: {
    loading: false,
    applications: []
  },

  onShow() {
    this.loadApplications();
  },

  normalizeDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;

    if (typeof value === 'number') {
      const timestamp = value < 10000000000 ? value * 1000 : value;
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'object') {
      const raw = value.$date || value._date || value.date || value.time || value.timestamp;
      return this.normalizeDate(raw);
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  },

  padTime(value) {
    return String(value).padStart(2, '0');
  },

  formatDate(value) {
    const date = this.normalizeDate(value);
    if (!date) return '';

    return `${date.getFullYear()}-${this.padTime(date.getMonth() + 1)}-${this.padTime(date.getDate())} ${this.padTime(date.getHours())}:${this.padTime(date.getMinutes())}`;
  },

  getTimeValue(value) {
    const date = this.normalizeDate(value);
    return date ? date.getTime() : 0;
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
