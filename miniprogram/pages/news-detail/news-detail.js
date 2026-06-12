const { getNewsDetail } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

function parseList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

Page({
  data: {
    loading: true,
    post: null,
    imageUrls: [],
    contentParagraphs: [],
    videoIsPlayable: false
  },

  onLoad(options) {
    this.loadPost(options.id);
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

  isPlayableVideoUrl(value) {
    return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(value || ''));
  },

  parseParagraphs(value) {
    return String(value || '')
      .split(/\n+/)
      .map((item) => item.trim())
      .filter(Boolean);
  },

  async loadPost(id) {
    if (!id) {
      this.setData({ loading: false });
      return;
    }

    try {
      const result = await getNewsDetail(id);
      const post = {
        ...result.data,
        display_date: this.formatDate(result.data.created_at)
      };

      this.setData({
        post,
        imageUrls: parseList(result.data.image_urls),
        contentParagraphs: this.parseParagraphs(result.data.content),
        videoIsPlayable: this.isPlayableVideoUrl(result.data.video_url),
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    }
  },

  previewImage(event) {
    const current = event.currentTarget.dataset.url;

    wx.previewImage({
      current,
      urls: this.data.imageUrls
    });
  },

  copyVideoLink() {
    if (!this.data.post || !this.data.post.video_url) {
      return;
    }

    wx.setClipboardData({
      data: this.data.post.video_url,
      success() {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  },

  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }

    wx.reLaunch({ url: '/pages/dynamic/dynamic' });
  },

  goNav(event) {
    goNavTarget(event.currentTarget.dataset.target);
  }
});
