const { getUnreadNotificationCount } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

const pageCopy = {
  submit: {
    title: '资料已提交',
    desc: '平台已收到你的艺人资料，管理员审核后会同步到消息中心和简历状态。',
    primaryText: '查看简历状态',
    primaryUrl: '/pages/resume-status/resume-status',
    secondaryText: '回到我的'
  },
  booking: {
    title: '预约意向已提交',
    desc: '工作人员会尽快联系你确认档期、预算与合作细节，处理进度可随时查看。',
    primaryText: '查看预约进度',
    primaryUrl: '/pages/booking-status/booking-status',
    secondaryText: '回到我的'
  },
  festival: {
    title: '合作意向已提交',
    desc: '音乐节合作申请已记录，工作人员处理后会通过消息中心通知你。',
    primaryText: '查看合作进度',
    primaryUrl: '/pages/festival-status/festival-status',
    secondaryText: '回到我的'
  },
  promotion: {
    title: '晋升申请已提交',
    desc: '平台已收到你的晋升申请，审核进度可在“我的”页面随时查看。',
    primaryText: '查看申请进度',
    primaryUrl: '/pages/promotion-status/promotion-status',
    secondaryText: '回到我的'
  }
};

Page({
  data: {
    type: 'submit',
    unreadNotificationCount: 0,
    unreadNotificationText: '',
    ...pageCopy.submit
  },

  onLoad(options) {
    const type = pageCopy[options.type] ? options.type : 'submit';

    this.setData({
      type,
      ...pageCopy[type]
    });
  },

  onShow() {
    this.loadUnreadNotificationCount();
  },

  async loadUnreadNotificationCount() {
    try {
      const result = await getUnreadNotificationCount();
      const count = Number((result.data || {}).count || 0);

      this.setData({
        unreadNotificationCount: count,
        unreadNotificationText: count > 99 ? '99+' : String(count)
      });
    } catch (error) {
      this.setData({
        unreadNotificationCount: 0,
        unreadNotificationText: ''
      });
    }
  },

  goPrimary() {
    wx.redirectTo({
      url: this.data.primaryUrl,
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  goCustomer() {
    goNavTarget('customer');
  },

  goNav(event) {
    const target = event.currentTarget.dataset.target;
    goNavTarget(target);
  }
});
