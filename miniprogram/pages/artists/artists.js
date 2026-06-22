const { getArtists } = require('../../utils/cloud');

const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    artists: [],
    texts: {
      eyebrow: 'Fuyangwenhua Artist Library',
      title: '\u5168\u56fd\u827a\u4eba\u5e93',
      subtitle: '\u7b7e\u7ea6\u827a\u4eba / \u5168\u56fd\u7b5b\u9009 / \u5728\u7ebf\u9884\u7ea6',
      search: '\u641c\u7d22',
      singer: '\u6b4c\u624b',
      musician: '\u4e50\u624b',
      group: '\u7ec4\u5408',
      more: '\u66f4\u591a',
      reset: '\u91cd\u7f6e',
      loading: '\u52a0\u8f7d\u4e2d...',
      empty: '\u6682\u65e0\u5df2\u5165\u5e93\u827a\u4eba',
      artistFallback: '\u827a',
      dispatchLabel: '\u63a5\u53d7\u8c03\u5ea6\u57ce\u5e02\uff1a',
      salaryLabel: '\u53c2\u8003\u85aa\u8d44\uff1a'
      ,
      home: '\u9996\u9875',
      artists: '\u827a\u4eba\u5e93',
      brand: '\u54c1\u724c',
      training: '\u57f9\u8bad',
      cooperation: '\u5408\u4f5c'
    },
    statusTabs: [
      { label: '\u5168\u56fd', value: '' },
      { label: '\u53ef\u9884\u7ea6', value: 'available' },
      { label: '\u5df2\u4e0b\u5e97', value: 'on_duty' }
    ],
    typeTabs: [
      { label: '\u5168\u90e8', value: '' },
      { label: '\u6b4c\u624b', value: '\u6b4c\u624b' },
      { label: '\u4e50\u624b', value: '\u4e50\u624b' },
      { label: '\u6c11\u4e50', value: '\u6c11\u4e50' },
      { label: 'Dancer', value: 'Dancer' },
      { label: 'MC', value: 'MC' },
      { label: '\u6c11\u821e\u821e\u8005', value: '\u6c11\u821e\u821e\u8005' },
      { label: 'VJ', value: 'VJ' },
      { label: 'LJ', value: 'LJ' },
      { label: '\u97e9\u821e\u821e\u8005', value: '\u97e9\u821e\u821e\u8005' },
      { label: '\u5609\u5bbe DJ', value: '\u5609\u5bbe DJ' },
      { label: '\u9a7b\u573aDJ', value: '\u9a7b\u573aDJ' }
    ],
    genderOptions: [
      { label: '\u5168\u90e8\u6027\u522b', value: '' },
      { label: '\u7537', value: '\u7537' },
      { label: '\u5973', value: '\u5973' },
      { label: '\u5176\u4ed6', value: '\u5176\u4ed6' }
    ],
    categoryOptions: [
      { label: '\u5168\u90e8\u7c7b\u578b', value: '' },
      { label: '\u6b4c\u624b', value: '\u6b4c\u624b' },
      { label: '\u4e50\u624b', value: '\u4e50\u624b' },
      { label: '\u6c11\u4e50', value: '\u6c11\u4e50' },
      { label: 'Dancer', value: 'Dancer' },
      { label: 'MC', value: 'MC' },
      { label: '\u6c11\u821e\u821e\u8005', value: '\u6c11\u821e\u821e\u8005' },
      { label: 'VJ', value: 'VJ' },
      { label: 'LJ', value: 'LJ' },
      { label: '\u97e9\u821e\u821e\u8005', value: '\u97e9\u821e\u821e\u8005' },
      { label: '\u5609\u5bbe DJ', value: '\u5609\u5bbe DJ' },
      { label: '\u9a7b\u573aDJ', value: '\u9a7b\u573aDJ' }
    ],
    filters: {
      status: '',
      city: '',
      dispatch_city: '',
      gender: '',
      category: '',
      keyword: '',
      featured_only: false
    },
    filterIndexes: {
      city: 0,
      dispatch_city: 0,
      gender: 0,
      category: 0
    },
    placeholders: {
      city: '\u6240\u5728\u57ce\u5e02',
      dispatch_city: '\u63a5\u53d7\u8c03\u5ea6\u57ce\u5e02',
      gender: '\u6027\u522b',
      category: '\u827a\u4eba\u7c7b\u578b',
      keyword: '\u641c\u7d22\u827a\u540d / \u98ce\u683c / \u57ce\u5e02'
    },
    loading: false
  },

  onLoad(options = {}) {
    if (options.library === 'fuyang') {
      this.setData({
        'texts.eyebrow': 'Fuyangwenhua Artists',
        'texts.title': '\u798f\u6d0b\u827a\u4eba\u5e93',
        'texts.subtitle': '\u798f\u6d0b\u6587\u5316\u65d7\u4e0b\u7cbe\u9009\u827a\u4eba',
        'filters.featured_only': true
      });
      return;
    }

    if (options.library === 'nationwide') {
      this.setData({
        'texts.eyebrow': 'National Artist Library',
        'texts.title': '\u5168\u56fd\u827a\u4eba\u5e93',
        'texts.subtitle': '\u516c\u5f00\u5e73\u53f0 / \u5728\u7ebf\u9884\u7ea6',
        'filters.featured_only': false
      });
    }
  },

  onShow() {
    if (this.hasLoaded) {
      return;
    }

    this.loadArtists();
  },

  onStatusTap(event) {
    const status = event.currentTarget.dataset.value || '';

    this.setData({
      'filters.status': status
    });
    this.loadArtists();
  },

  onTypeTap(event) {
    const category = event.currentTarget.dataset.value || '';

    if (!category) {
      this.setData({
        'filters.category': ''
      });
      this.loadArtists();
      return;
    }

    wx.navigateTo({
      url: `/pages/artist-category/artist-category?category=${encodeURIComponent(category)}`
    });
  },

  onFilterInput(event) {
    const field = event.currentTarget.dataset.field;

    this.setData({
      [`filters.${field}`]: event.detail.value
    });
  },

  onPickerFilterChange(event) {
    const field = event.currentTarget.dataset.field;
    const optionsKey = event.currentTarget.dataset.options;
    const index = Number(event.detail.value);
    const option = this.data[optionsKey][index] || { value: '' };

    this.setData({
      [`filters.${field}`]: option.value,
      [`filterIndexes.${field}`]: index
    });
    this.loadArtists();
  },

  onRegionFilterChange(event) {
    const field = event.currentTarget.dataset.field;
    const region = event.detail.value || [];
    const city = String(region[1] || region[0] || '').trim();

    this.setData({
      [`filters.${field}`]: city
    });
    this.loadArtists();
  },

  resetFilters() {
    this.setData({
      filters: {
        status: '',
        city: '',
        dispatch_city: '',
        gender: '',
        category: '',
        keyword: '',
        featured_only: this.data.filters.featured_only
      },
      filterIndexes: {
        city: 0,
        dispatch_city: 0,
        gender: 0,
        category: 0
      }
    });
    this.loadArtists();
  },

  buildFilters() {
    const filters = {};
    const { status, city, dispatch_city, gender, category, keyword, featured_only } = this.data.filters;

    if (featured_only) {
      filters.featured_only = true;
    }

    if (status) {
      filters.work_status = status;
    }

    if (city) {
      filters.city = city;
    }

    if (dispatch_city) {
      filters.dispatch_city = dispatch_city;
    }

    if (gender) {
      filters.gender = gender;
    }

    if (category) {
      filters.category = category;
    }

    if (keyword) {
      filters.keyword = keyword;
    }

    return filters;
  },

  normalizeArtist(artist) {
    const canBook = !!artist.can_book;
    const tagList = String(artist.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag && tag !== artist.category);

    return {
      ...artist,
      tag_list: tagList,
      status_label: canBook ? '\u53ef\u9884\u7ea6' : '\u5df2\u4e0b\u5e97',
      status_class: canBook ? 'bookable' : 'closed',
      display_gender: artist.gender || '\u827a\u4eba',
      display_category: artist.category || artist.tags || '\u97f3\u4e50\u4eba',
      dispatch_display: artist.dispatch_cities || artist.city || '\u5168\u56fd'
    };
  },

  downloadCloudFile(fileID) {
    if (!fileID || !/^cloud:\/\//.test(fileID)) {
      return Promise.reject(new Error('没有可下载的云文件'));
    }

    return wx.cloud.downloadFile({ fileID }).then((result) => result.tempFilePath);
  },

  onAvatarError(event) {
    const index = Number(event.currentTarget.dataset.index);
    const artist = this.data.artists[index];

    if (!artist || !artist.avatar_file_id) {
      return;
    }

    this.downloadCloudFile(artist.avatar_file_id)
      .then((tempFilePath) => {
        this.setData({
          [`artists[${index}].avatar_url`]: tempFilePath
        });
      })
      .catch(() => {
        this.setData({
          [`artists[${index}].avatar_url`]: artist.avatar_file_id
        });
      });
  },

  async loadArtists() {
    this.setData({ loading: true });

    try {
      const result = await getArtists({
        ...this.buildFilters(),
        light_media: true
      });

      this.setData({
        artists: (result.data || []).map((artist) => this.normalizeArtist(artist))
      });
      this.hasLoaded = true;
      this.lastLoadedAt = Date.now();
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goSubmit() {
    wx.navigateTo({
      url: '/pages/submit/submit',
      fail() {
        wx.redirectTo({ url: '/pages/submit/submit' });
      }
    });
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id;

    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
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

