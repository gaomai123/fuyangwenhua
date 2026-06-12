const { getProducts } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    loading: false,
    products: [],
    filteredProducts: [],
    categories: [{ label: '全部', value: '' }],
    activeCategory: ''
  },

  onShow() {
    if (this.hasLoaded && Date.now() - this.lastLoadedAt < 30000) {
      return;
    }

    this.loadProducts();
  },

  onPullDownRefresh() {
    this.loadProducts(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  normalizeProduct(product) {
    return {
      ...product,
      cover_url: product.cover_url || '/images/home-entry-training.jpg',
      cover_failed: false,
      price_text: product.price_text || '批发价联系我们',
      summary: product.summary || '产品图片和文案由福洋文化后台维护，支持批发咨询。'
    };
  },

  buildCategories(products) {
    const names = Array.from(new Set(products.map((item) => item.category).filter(Boolean)));

    return [
      { label: '全部', value: '' },
      ...names.map((name) => ({ label: name, value: name }))
    ];
  },

  getFilteredProducts(products = this.data.products, activeCategory = this.data.activeCategory) {
    if (!activeCategory) {
      return products;
    }

    return products.filter((item) => item.category === activeCategory);
  },

  async loadProducts(force = false) {
    if (!force && this.data.loading) {
      return;
    }

    this.setData({ loading: true });

    try {
      const result = await getProducts();
      const products = (result.data || []).map((item) => this.normalizeProduct(item));
      const categories = this.buildCategories(products);

      this.setData({
        products,
        filteredProducts: this.getFilteredProducts(products),
        categories
      });
      this.hasLoaded = true;
      this.lastLoadedAt = Date.now();
    } catch (error) {
      wx.showToast({
        title: error.message || '读取产品失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCategoryTap(event) {
    const activeCategory = event.currentTarget.dataset.value || '';

    this.setData({
      activeCategory,
      filteredProducts: this.getFilteredProducts(this.data.products, activeCategory)
    });
  },

  resetCategory() {
    this.setData({
      activeCategory: '',
      filteredProducts: this.data.products
    });
  },

  onCoverError(event) {
    const id = event.currentTarget.dataset.id;
    const products = this.data.products.map((item) => (
      item.id === id
        ? { ...item, cover_url: '/images/home-entry-training.jpg', cover_failed: true }
        : item
    ));

    this.setData({
      products,
      filteredProducts: this.getFilteredProducts(products)
    });
  },

  openProduct(event) {
    const id = event.currentTarget.dataset.id;

    if (!id) {
      return;
    }

    wx.navigateTo({
      url: `/pages/product-detail/product-detail?id=${id}`,
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
