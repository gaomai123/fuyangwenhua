const { getNewsList, getUnreadNotificationCount } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

const categories = [
  { label: '全部', value: '' },
  { label: '平台公告', value: '平台公告' },
  { label: '招募通知', value: '招募通知' },
  { label: '培训动态', value: '培训动态' },
  { label: '音乐节资讯', value: '音乐节资讯' },
  { label: '合作公告', value: '合作公告' },
  { label: '系统通知', value: '系统通知' }
];

Page({
  data: {
    loading: false,
    posts: [],
    categories,
    activeCategory: '',
    unreadNotificationCount: 0,
    unreadNotificationText: ''
  },

  onShow() {
    if (this.hasLoaded && this.lastLoadedAt && Date.now() - this.lastLoadedAt < 30000) {
      this.loadUnreadNotificationCount();
      return;
    }

    this.loadPosts();
    this.loadUnreadNotificationCount();
  },

  onPullDownRefresh() {
    this.loadPosts(true).then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  },

  formatDate(value) {
    if (!value) {
      return '';
    }

    if (value instanceof Date) {
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${value.getFullYear()}-${month}-${day}`;
    }

    return String(value).slice(0, 10);
  },

  normalizePost(post) {
    return {
      ...post,
      id: post.id || post._id,
      display_date: this.formatDate(post.created_at),
      top_label: post.is_top ? '置顶' : '',
      summary: post.summary || '点击查看动态详情'
    };
  },

  async loadPosts(force = false) {
    const category = this.data.activeCategory;

    if (!force && this.categoryCache && this.categoryCache[category]) {
      this.setData({ posts: this.categoryCache[category] });
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await getNewsList(category);
      const posts = (result.data || []).map((post) => this.normalizePost(post));

      this.categoryCache = {
        ...(this.categoryCache || {}),
        [category]: posts
      };

      this.setData({ posts });
      this.hasLoaded = true;
      this.lastLoadedAt = Date.now();
    } catch (error) {
      wx.showToast({
        title: error.message || '读取动态失败',
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

  onCategoryTap(event) {
    const activeCategory = event.currentTarget.dataset.value || '';

    if (activeCategory === this.data.activeCategory) {
      return;
    }

    this.setData({ activeCategory });
    this.loadPosts();
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id;

    if (!id) {
      return;
    }

    wx.navigateTo({
      url: `/pages/news-detail/news-detail?id=${id}`,
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  goPromotion() {
    wx.navigateTo({
      url: '/pages/promotion/promotion',
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({
        delta: 1,
        animationType: 'slide-out-right',
        animationDuration: 200
      });
      return;
    }

    wx.redirectTo({
      url: '/pages/index/index'
    });
  },

  goNav(event) {
    goNavTarget(event.currentTarget.dataset.target);
  }
});
