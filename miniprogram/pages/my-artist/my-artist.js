const { getMyArtistProfile, updateMyArtistStatus } = require('../../utils/cloud');

const workStatusText = {
  available: '待岗 / 可预约',
  on_duty: '已下店 / 不可预约',
  paused: '暂停接单'
};

const reviewStatusText = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

const statusOptions = [
  {
    value: 'available',
    title: '待岗 / 可预约',
    desc: '可以接收平台预约与调度'
  },
  {
    value: 'on_duty',
    title: '已下店 / 不可预约',
    desc: '正在门店驻唱，暂不接收新预约'
  },
  {
    value: 'paused',
    title: '暂停接单',
    desc: '短期休整或档期原因，暂不接收预约'
  }
];

function normalizeArtist(artist) {
  if (!artist) {
    return null;
  }

  const displayTags = String(artist.tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag && tag !== artist.category)
    .join('、');

  return {
    ...artist,
    display_tags: displayTags || '-'
  };
}

Page({
  data: {
    loading: true,
    updating: false,
    artist: null,
    statusOptions,
    workStatusText,
    reviewStatusText
  },

  onShow() {
    this.loadPageData();
  },

  async loadPageData() {
    this.setData({ loading: true });

    try {
      const result = await getMyArtistProfile();

      this.setData({
        artist: normalizeArtist(result.data),
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

  async updateStatus(event) {
    const workStatus = event.currentTarget.dataset.value;

    if (!this.data.artist || !workStatus || this.data.artist.work_status === workStatus) {
      return;
    }

    this.setData({ updating: true });

    try {
      const result = await updateMyArtistStatus(workStatus);

      this.setData({
        artist: {
          ...this.data.artist,
          work_status: result.data.work_status,
          can_book: result.data.can_book
        }
      });

      wx.showToast({
        title: '状态已更新',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    } finally {
      this.setData({ updating: false });
    }
  }
});
