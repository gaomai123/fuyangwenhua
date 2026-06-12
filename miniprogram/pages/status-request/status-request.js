const { getMyArtistProfile, updateMyArtistStatus } = require('../../utils/cloud');

const statusOptions = [
  {
    value: 'available',
    title: '待岗 / 可预约',
    desc: '可以接受平台预约与调度'
  },
  {
    value: 'on_duty',
    title: '已下店 / 不可预约',
    desc: '已在门店驻唱，暂不接受新预约'
  },
  {
    value: 'paused',
    title: '暂停接单',
    desc: '短期休整或档期原因，暂停接受预约'
  }
];

const workStatusText = {
  available: '待岗 / 可预约',
  on_duty: '已下店 / 不可预约',
  paused: '暂停接单'
};

Page({
  data: {
    loading: true,
    submitting: false,
    artist: null,
    statusOptions,
    workStatusText,
    requestedStatus: 'available'
  },

  onLoad() {
    this.loadArtistProfile();
  },

  async loadArtistProfile() {
    try {
      const result = await getMyArtistProfile();

      const artist = result.data || null;

      this.setData({
        artist,
        requestedStatus: artist ? artist.work_status || 'available' : 'available',
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

  selectStatus(event) {
    this.setData({
      requestedStatus: event.currentTarget.dataset.value
    });
  },

  async submitRequest() {
    if (!this.data.artist) {
      wx.showToast({
        title: '暂未绑定艺人档案',
        icon: 'none'
      });
      return;
    }

    if (!this.data.requestedStatus) {
      wx.showToast({
        title: '请选择申请状态',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      await updateMyArtistStatus(this.data.requestedStatus);

      wx.showToast({
        title: '状态已更新',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 700);
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
