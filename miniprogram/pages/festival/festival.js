const { getUnreadNotificationCount, submitFestivalLead } = require('../../utils/cloud');
const { cases: festivalCases, getFestivalCases } = require('../../utils/festivalCases');
const { goNavTarget } = require('../../utils/nav');

const initialForm = {
  contactName: '',
  phone: '',
  company: '',
  city: '',
  eventDate: '',
  requirement: ''
};

Page({
  data: {
    banners: [
      {
        title: '音乐节合作\n共创音乐现场新体验',
        subtitle: '整合资源 x 创意运营 x 品牌共赢',
        mark: 'FUYANGWENHUA',
        image: '/images/festival-banner-shantou-group.jpg'
      },
      {
        title: '城市音乐节\n打造地标级现场声浪',
        subtitle: '艺人统筹 x 舞台执行 x 票务营销',
        mark: 'CITY MUSIC FESTIVAL',
        image: '/images/festival-banner-mall-crowd.jpg'
      },
      {
        title: '品牌音乐现场\n让年轻人主动靠近品牌',
        subtitle: '内容共创 x 场景植入 x 商业转化',
        mark: 'BRAND LIVE SHOW',
        image: '/images/festival-banner-stage-crowd.jpg'
      },
      {
        title: '星光舞台\n记录每一次沸腾',
        subtitle: '现场影像 x 舞台视觉 x 品牌露出',
        mark: 'STARLIGHT LIVE',
        image: '/images/festival-banner-starlight-stage.jpg'
      }
    ],
    cases: festivalCases,
    cooperationModes: [
      {
        title: '联合主办',
        desc: '共同策划与执行'
      },
      {
        title: '冠名赞助',
        desc: '品牌权益深度曝光'
      },
      {
        title: '品牌植入',
        desc: '场景植入 / 内容共创'
      },
      {
        title: '定制合作',
        desc: '专属方案按需定制'
      }
    ],
    servicePoints: [
      '艺人资源整合',
      '舞台制作统筹',
      '票务营销支持',
      '现场执行落地'
    ],
    typeOptions: ['城市音乐节', '商业演出', '文旅活动', '品牌快闪', '其他合作'],
    typeIndex: 0,
    phone: '400-888-2024',
    wechat: 'fuyangwenhua2024',
    form: { ...initialForm },
    submitting: false,
    unreadNotificationCount: 0,
    unreadNotificationText: ''
  },

  onLoad() {
    this.loadFestivalCases();
  },

  onShow() {
    this.loadUnreadNotificationCount();
  },

  async loadFestivalCases(force = false) {
    const now = Date.now();

    if (!force && this.caseCache && now - this.caseCacheAt < 300000) {
      this.setData({ cases: this.caseCache });
      return;
    }

    try {
      const cases = await getFestivalCases();
      this.caseCache = cases;
      this.caseCacheAt = now;
      this.setData({ cases });
    } catch (error) {
      this.setData({ cases: festivalCases });
    }
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

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value
    });
  },

  onTypeChange(event) {
    this.setData({
      typeIndex: Number(event.detail.value)
    });
  },

  callPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.phone
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: this.data.wechat,
      success() {
        wx.showToast({
          title: '微信已复制',
          icon: 'success'
        });
      }
    });
  },

  openCase(event) {
    const id = event.currentTarget.dataset.id;

    if (!id) {
      return;
    }

    wx.navigateTo({
      url: `/pages/festival-case/festival-case?id=${id}`
    });
  },

  async submitLead() {
    const { form, submitting } = this.data;

    if (submitting) {
      return;
    }

    if (!form.contactName.trim()) {
      wx.showToast({
        title: '请填写联系人',
        icon: 'none'
      });
      return;
    }

    if (!/^1\d{10}$/.test(form.phone)) {
      wx.showToast({
        title: '请填写正确手机号',
        icon: 'none'
      });
      return;
    }

    this.setData({ submitting: true });

    try {
      await submitFestivalLead({
        contact_name: form.contactName,
        phone: form.phone,
        company: form.company,
        city: form.city,
        event_date: form.eventDate,
        cooperation_type: this.data.typeOptions[this.data.typeIndex],
        requirement: form.requirement
      });

      this.setData({
        form: { ...initialForm },
        typeIndex: 0
      });

      wx.redirectTo({
        url: '/pages/success/success?type=festival'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goNav(event) {
    goNavTarget(event.currentTarget.dataset.target);
  }
});
