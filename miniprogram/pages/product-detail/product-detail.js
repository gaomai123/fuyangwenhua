const { getProductDetail } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

function parseImages(product) {
  const images = String(product.image_urls || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (product.cover_url && !images.includes(product.cover_url)) {
    images.unshift(product.cover_url);
  }

  return images.length ? images : ['/images/home-entry-training.jpg'];
}

Page({
  data: {
    loading: true,
    product: null,
    images: []
  },

  onLoad(options) {
    this.loadProduct(options.id);
  },

  async loadProduct(id) {
    if (!id) {
      this.setData({ loading: false });
      return;
    }

    try {
      const result = await getProductDetail(id);
      const product = {
        ...result.data,
        price_text: result.data.price_text || '批发价联系我们',
        summary: result.data.summary || '欢迎通过微信或电话咨询产品批发信息。',
        specs: result.data.specs || '具体规格以沟通确认为准。',
        detail: result.data.detail || '产品图片和文案由后台维护，支持按批次咨询。'
      };

      this.setData({
        product,
        images: parseImages(product),
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: error.message || '读取产品失败',
        icon: 'none'
      });
    }
  },

  previewImage(event) {
    wx.previewImage({
      current: event.currentTarget.dataset.url,
      urls: this.data.images
    });
  },

  onImageError(event) {
    const index = Number(event.currentTarget.dataset.index);

    if (!Number.isInteger(index) || this.data.images[index] === '/images/home-entry-training.jpg') {
      return;
    }

    const images = [...this.data.images];
    images[index] = '/images/home-entry-training.jpg';
    this.setData({ images });
  },

  callPhone() {
    const phone = this.data.product && this.data.product.contact_phone;

    if (!phone) {
      wx.showToast({
        title: '暂无联系电话',
        icon: 'none'
      });
      return;
    }

    wx.makePhoneCall({ phoneNumber: phone });
  },

  copyWechat() {
    const wechat = this.data.product && this.data.product.contact_wechat;

    if (!wechat) {
      wx.showToast({
        title: '暂无微信号',
        icon: 'none'
      });
      return;
    }

    wx.setClipboardData({
      data: wechat,
      success() {
        wx.showToast({
          title: '微信已复制',
          icon: 'success'
        });
      }
    });
  },

  goNav(event) {
    goNavTarget(event.currentTarget.dataset.target);
  }
});
