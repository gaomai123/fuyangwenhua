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

function parseFileIds(value) {
  return parsePhotos(value).filter((item) => /^cloud:\/\//.test(item));
}

function isPlayableVideoUrl(value) {
  const url = String(value || '').trim();

  return /^wxfile:\/\//.test(url) || /^http/.test(url) || /^cloud:\/\//.test(url) || /\/uploads\/videos\//.test(url) || /\.(mp4|mov|m4v|webm)(\?|$)/i.test(url);
}

function parseVideos(value, fileIds = []) {
  return parsePhotos(value).map((url, index) => ({
    url,
    fileID: fileIds[index] || (/^cloud:\/\//.test(url) ? url : ''),
    loadingLocal: false,
    playable: isPlayableVideoUrl(url)
  }));
}

function normalizeArtist(artist) {
  const canBook = !!artist.can_book;
  const displayTags = (Array.isArray(artist.tags) ? artist.tags : String(artist.tags || '').split(','))
    .map((tag) => String(tag).trim())
    .filter((tag) => tag && tag !== artist.category)
    .join('、');

  return {
    ...artist,
    display_salary: artist.salary_display || artist.price || '\u9762\u8bae',
    display_bio: artist.bio || '\u6682\u65e0\u7b80\u4ecb',
    display_category: artist.category || artist.tags || '\u97f3\u4e50\u4eba',
    display_tags: displayTags || '-',
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
    artPhotoFileIds: [],
    lifePhotos: [],
    lifePhotoFileIds: [],
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
      tags: '\u98ce\u683c\u6807\u7b7e',
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
      const legacyPhotoFileIds = parseFileIds(result.data.photo_file_ids);
      const artPhotoFileIds = parseFileIds(result.data.art_photo_file_ids);
      const lifePhotoFileIds = parseFileIds(result.data.life_photo_file_ids);
      const videoFileIds = parseFileIds(result.data.video_file_ids);
      const videos = parseVideos(result.data.video_urls || result.data.video_url, videoFileIds);

      this.setData({
        artist,
        artPhotos: artPhotos.length ? artPhotos : legacyPhotos,
        artPhotoFileIds: artPhotoFileIds.length ? artPhotoFileIds : legacyPhotoFileIds,
        lifePhotos,
        lifePhotoFileIds,
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

  downloadCloudFile(fileID) {
    if (!fileID || !/^cloud:\/\//.test(fileID)) {
      return Promise.reject(new Error('没有可下载的云文件'));
    }

    return wx.cloud.downloadFile({ fileID }).then((result) => result.tempFilePath);
  },

  onHeroImageError() {
    const artist = this.data.artist || {};

    if (!artist.avatar_file_id || artist.avatar_url === artist.avatar_file_id) {
      return;
    }

    this.downloadCloudFile(artist.avatar_file_id)
      .then((tempFilePath) => {
        this.setData({
          'artist.avatar_url': tempFilePath
        });
      })
      .catch(() => {
        this.setData({
          'artist.avatar_url': artist.avatar_file_id
        });
      });
  },

  onPhotoError(event) {
    const group = event.currentTarget.dataset.group;
    const index = Number(event.currentTarget.dataset.index);
    const listKey = group === 'life' ? 'lifePhotos' : 'artPhotos';
    const fileIds = group === 'life' ? this.data.lifePhotoFileIds : this.data.artPhotoFileIds;
    const fileID = fileIds[index];

    if (!fileID) {
      return;
    }

    this.downloadCloudFile(fileID)
      .then((tempFilePath) => {
        this.setData({
          [`${listKey}[${index}]`]: tempFilePath
        });
      })
      .catch(() => {
        this.setData({
          [`${listKey}[${index}]`]: fileID
        });
      });
  },

  onVideoError(event) {
    const index = Number(event.currentTarget.dataset.index);
    const video = this.data.videos[index];

    if (!video || !video.fileID || video.loadingLocal) {
      return;
    }

    this.setData({
      [`videos[${index}].loadingLocal`]: true
    });

    this.downloadCloudFile(video.fileID)
      .then((tempFilePath) => {
        this.setData({
          [`videos[${index}].url`]: tempFilePath,
          [`videos[${index}].playable`]: true,
          [`videos[${index}].loadingLocal`]: false,
          videoIsPlayable: true
        });
      })
      .catch(() => {
        this.setData({
          [`videos[${index}].url`]: video.fileID,
          [`videos[${index}].loadingLocal`]: false
        });
      });
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

