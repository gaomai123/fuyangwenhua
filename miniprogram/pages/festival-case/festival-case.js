const { getFestivalCase, getFestivalCaseDetail } = require('../../utils/festivalCases');

function isPlayableVideoUrl(value) {
  const url = String(value || '').trim();

  if (!url) {
    return false;
  }

  if (url.startsWith('cloud://') || url.startsWith('wxfile://')) {
    return true;
  }

  return /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function resolveMediaUrl(value) {
  const url = String(value || '').trim();

  if (!url || /^https?:\/\//i.test(url) || url.startsWith('wxfile://') || url.startsWith('cloud://')) {
    return url;
  }

  const apiBase = ((getApp().globalData || {}).apiBase || '').replace(/\/api\/?$/, '');

  if (url.startsWith('/uploads/')) {
    return `${apiBase}${url}`;
  }

  return url;
}

Page({
  data: {
    item: null,
    videoUrl: '',
    videoIsPlayable: false
  },

  async onLoad(options) {
    let item = null;

    try {
      item = await getFestivalCaseDetail(options.id);
    } catch (error) {
      item = getFestivalCase(options.id);
    }

    if (!item) {
      wx.showToast({
        title: '案例不存在',
        icon: 'none'
      });
      return;
    }

    const videoUrl = resolveMediaUrl(item.video_url);

    this.setData({
      item,
      videoUrl,
      videoIsPlayable: isPlayableVideoUrl(videoUrl)
    });
  },

  copyVideoLink() {
    if (!this.data.videoUrl) {
      return;
    }

    wx.setClipboardData({
      data: this.data.videoUrl,
      success() {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      }
    });
  }
});
