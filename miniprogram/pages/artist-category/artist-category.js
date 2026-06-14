const { getArtists } = require('../../utils/cloud');

const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    category: '',
    artists: [],
    loading: true,
    texts: {
      eyebrow: 'Fuyangwenhua Artist Category',
      titleSuffix: '\u827a\u4eba',
      subtitle: '\u7cbe\u51c6\u67e5\u770b\u5206\u7c7b\u827a\u4eba / \u5728\u7ebf\u9884\u7ea6 / \u540e\u53f0\u7edf\u4e00\u7ba1\u7406',
      loading: '\u52a0\u8f7d\u4e2d...',
      empty: '\u6682\u65e0\u8be5\u7c7b\u578b\u827a\u4eba',
      reset: '\u91cd\u7f6e',
      artistFallback: '\u827a',
      dispatchLabel: '\u63a5\u53d7\u8c03\u5ea6\u57ce\u5e02\uff1a',
      salaryLabel: '\u53c2\u8003\u85aa\u8d44\uff1a',
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
    genderOptions: [
      { label: '\u5168\u90e8\u6027\u522b', value: '' },
      { label: '\u7537', value: '\u7537' },
      { label: '\u5973', value: '\u5973' },
      { label: '\u5176\u4ed6', value: '\u5176\u4ed6' }
    ],
    filters: {
      status: '',
      category: '',
      city: '',
      gender: '',
      dispatch_city: ''
    },
    filterIndexes: {
      category: 0,
      city: 0,
      gender: 0,
      dispatch_city: 0
    },
    placeholders: {
      category: '\u827a\u4eba\u7c7b\u578b',
      city: '\u6240\u5728\u57ce\u5e02',
      gender: '\u6027\u522b',
      dispatch_city: '\u63a5\u53d7\u8c03\u5ea6\u57ce\u5e02'
    }
  },

  onLoad(options) {
    const category = decodeURIComponent(options.category || '');
    const categoryIndex = this.findOptionIndex('categoryOptions', category);

    this.setData({
      category,
      'filters.category': category,
      'filterIndexes.category': categoryIndex
    });
    this.loadArtists();
  },

  findOptionIndex(optionsKey, value) {
    const index = this.data[optionsKey].findIndex((item) => item.value === value);

    return index >= 0 ? index : 0;
  },

  onStatusTap(event) {
    this.setData({
      'filters.status': event.currentTarget.dataset.value || ''
    });
    this.loadArtists();
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

    if (field === 'category') {
      this.setData({
        category: option.value || '\u5168\u90e8'
      });
    }

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
    const category = this.data.category === '\u5168\u90e8' ? '' : this.data.category;
    const categoryIndex = this.findOptionIndex('categoryOptions', category);

    this.setData({
      filters: {
        status: '',
        category,
        city: '',
        gender: '',
        dispatch_city: ''
      },
      filterIndexes: {
        category: categoryIndex,
        city: 0,
        gender: 0,
        dispatch_city: 0
      }
    });
    this.loadArtists();
  },

  buildFilters() {
    const filters = {};
    const { status, category, city, gender, dispatch_city } = this.data.filters;

    if (status) {
      filters.work_status = status;
    }

    if (category) {
      filters.category = category;
    }

    if (city) {
      filters.city = city;
    }

    if (gender) {
      filters.gender = gender;
    }

    if (dispatch_city) {
      filters.dispatch_city = dispatch_city;
    }

    return filters;
  },

  normalizeArtist(artist) {
    const canBook = !!artist.can_book;
    const tagList = String(artist.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

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

  async loadArtists() {
    this.setData({ loading: true });

    try {
      const result = await getArtists(this.buildFilters());

      this.setData({
        artists: (result.data || []).map((artist) => this.normalizeArtist(artist))
      });
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
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

