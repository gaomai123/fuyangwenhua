const { getArtistDetail } = require('../../utils/cloud');

function parsePhotos(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isPlayableVideoUrl(value) {
  const url = String(value || '').trim();

  return /^cloud:\/\//.test(url) || /\/uploads\/videos\//.test(url) || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function parseVideos(value) {
  return parsePhotos(value).map((url) => ({
    url,
    playable: isPlayableVideoUrl(url)
  }));
}

function normalizeArtist(artist) {
  const canBook = !!artist.can_book;

  return {
    ...artist,
    display_salary: artist.salary_display || artist.price || '\u9762\u8bae',
    display_bio: artist.bio || '\u6682\u65e0\u7b80\u4ecb',
    display_category: artist.category || artist.tags || '\u97f3\u4e50\u4eba',
    display_singing_type: artist.singing_type || '-',
    display_dispatch: artist.dispatch_cities || artist.city || '\u5168\u56fd',
    status_label: canBook ? '\u53ef\u9884\u7ea6' : '\u5df2\u4e0b\u5e97',
    status_class: canBook ? 'bookable' : 'closed',
    action_label: canBook ? '\u9884\u7ea6\u827a\u4eba' : '\u5df2\u4e0b\u5e97\uff0c\u4ec5\u53ef\u67e5\u770b',
    action_class: canBook ? 'book-action' : 'disabled-action'
  };
}

const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    artist: null,
    artPhotos: [],
    lifePhotos: [],
    videos: [],
    videoIsPlayable: false,
    loading: true,
    texts: {
      loading: '\u52a0\u8f7d\u4e2d...',
      notFound: '\u6ca1\u6709\u627e\u5230\u827a\u4eba\u8d44\u6599',
      basicInfo: '\u57fa\u7840\u4fe1\u606f',
      gender: '\u6027\u522b',
      age: '\u5e74\u9f84',
      height: '\u8eab\u9ad8',
      city: '\u6240\u5728\u57ce\u5e02',
      category: '\u827a\u4eba\u7c7b\u578b',
      singingType: '\u5531\u529f\u7c7b\u578b',
      dispatch: '\u63a5\u53d7\u8c03\u5ea6\u57ce\u5e02',
      salary: '\u53c2\u8003\u85aa\u8d44',
      bio: '\u827a\u4eba\u7b80\u4ecb',
      artPhotos: '\u827a\u672f\u7167',
      lifePhotos: '\u751f\u6d3b\u7167',
      video: '\u7cbe\u5f69\u89c6\u9891 / \u821e\u53f0\u7247\u6bb5',
      videoLink: '\u5916\u90e8\u89c6\u9891\u94fe\u63a5',
      copyVideoLink: '\u590d\u5236\u89c6\u9891\u94fe\u63a5',
      home: '\u9996\u9875',
      artists: '\u827a\u4eba\u5e93',
      brand: '\u54c1\u724c',
      training: '\u57f9\u8bad',
      cooperation: '\u5408\u4f5c'
    }
  },

  onLoad(options) {
    this.loadDetail(options.id);
  },

  async loadDetail(id) {
    if (!id) {
      this.setData({ loading: false });
      return;
    }

    try {
      const result = await getArtistDetail(id);
      const artist = normalizeArtist(result.data);
      const legacyPhotos = parsePhotos(result.data.photo_urls);
      const artPhotos = parsePhotos(result.data.art_photo_urls);
      const lifePhotos = parsePhotos(result.data.life_photo_urls);
      const videos = parseVideos(result.data.video_urls || result.data.video_url);

      this.setData({
        artist,
        artPhotos: artPhotos.length ? artPhotos : legacyPhotos,
        lifePhotos,
        videos,
        videoIsPlayable: videos.some((item) => item.playable),
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

  previewPhoto(event) {
    const current = event.currentTarget.dataset.url;

    wx.previewImage({
      current,
      urls: event.currentTarget.dataset.group === 'life' ? this.data.lifePhotos : this.data.artPhotos
    });
  },

  goBooking() {
    if (!this.data.artist || !this.data.artist.can_book) {
      return;
    }

    wx.navigateTo({
      url: `/pages/booking/booking?id=${this.data.artist.id}&name=${encodeURIComponent(this.data.artist.stage_name)}`
    });
  },

  copyVideoLink() {
    const firstVideo = this.data.videos && this.data.videos[0];
    const url = firstVideo ? firstVideo.url : this.data.artist && this.data.artist.video_url;

    if (!url) {
      return;
    }

    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({
          title: '\u94fe\u63a5\u5df2\u590d\u5236',
          icon: 'success'
        });
      }
    });
  },

  goNav(event) {
    const target = event.currentTarget.dataset.target;
    if (target === 'training') {
      wx.showToast({
        title: '\u8be5\u677f\u5757\u5c06\u5728\u540e\u7eed\u9636\u6bb5\u5f00\u653e',
        icon: 'none'
      });
      return;
    }

    goNavTarget(target);
  }
});

