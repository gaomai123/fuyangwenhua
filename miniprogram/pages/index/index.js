const { getArtists, getUnreadNotificationCount } = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    recommendedArtists: [],
    loadingArtists: false,
    unreadNotificationCount: 0,
    unreadNotificationText: '',
    bannerIndex: 0,
    showDisclaimerModal: false,
    disclaimerContent: '1. 平台艺人库分为【福洋艺人库】与【全国艺人库】两大板块：\n【福洋艺人库】为本公司签约艺人，资料真实可核验，服务品质有平台保障；\n【全国艺人库】非福洋艺人为自主入驻免费展示艺人，所有资料均由艺人自行上传填报，平台不作真实性审核，无法保证信息、本人形象及职业素养与资料一致。\n2. 酒吧商家与公开艺人洽谈、合作产生的沟通、劳务、经济纠纷等全部事宜，均为双方私下自主对接，平台不参与合作约定，不承担任何相关法律与经济责任。\n3. 如遇公开艺人虚假信息侵权纠纷，平台仅配合下架简历，不承担连带赔偿责任。\n4.本平台拥有最终解释权。',
    banners: [
      {
        titleLine1: '\u6210\u4e3a\u798f\u6d0b\u827a\u4eba',
        titleLine2: '\u675c\u7edd\u6b20\u85aa\u9ed1\u573a',
        desc: '\u6210\u4e3a\u798f\u6d0b\u827a\u4eba\u7684\u4f18\u52bf',
        mark: 'FUYANG ARTIST',
        tone: 'recruit',
        image: '/images/home-banner-fuyang-artist.jpg',
        type: 'submit',
        adClass: 'recruit-ad',
        points: [
          '\u5982\u9047\u62d6\u6b20\u85aa\u8d44\u9ed1\u573a\uff0c\u798f\u6d0b\u5148\u884c\u57ab\u4ed8\u827a\u4eba\u85aa\u8d44',
          '\u4f18\u5148\u63a8\u9001\u9ad8\u8d28\u91cf\u5408\u4f5c\u95e8\u5e97',
          '\u4e2a\u4eba IP \u5e2e\u6276',
          '\u827a\u4eba\u8fdb\u9636\u73ed\u514d\u8d39\u57f9\u8bad',
          '\u4f18\u5148\u63a8\u9001\u5404\u5927\u97f3\u4e50\u8282\u3001\u7efc\u827a\u3001\u5546\u4e1a\u6f14\u51fa\u3001\u5609\u5bbe\u6b4c\u624b\u7b49'
        ]
      },
      {
        titleLine1: '\u8ba9\u70ed\u7231\u88ab\u770b\u89c1',
        titleLine2: '\u8ba9\u624d\u534e\u88ab\u6210\u5c31',
        desc: '\u8fde\u63a5\u97f3\u4e50\u4e0e\u673a\u9047\uff0c\u6210\u5c31\u66f4\u5927\u7684\u821e\u53f0',
        mark: 'FUYANGWENHUA',
        tone: 'main',
        image: '/images/home-banner.jpg',
        type: 'artists-fuyang'
      },
      {
        titleLine1: '\u5168\u56fd\u827a\u4eba\u62db\u52df',
        titleLine2: '\u8ba9\u4f5c\u54c1\u8fdb\u5165\u821e\u53f0',
        desc: '\u6b4c\u624b\u3001\u4e50\u624b\u3001\u6c11\u4e50\u3001DJ\u3001Dancer\u3001MC \u5747\u53ef\u6295\u9012\u7b80\u5386',
        mark: 'ARTIST BASE',
        tone: 'artist',
        image: '/images/home-entry-artists.jpg',
        type: 'submit'
      },
      {
        titleLine1: '\u97f3\u4e50\u8282\u5408\u4f5c',
        titleLine2: '\u4ece\u8d44\u6e90\u5230\u843d\u5730',
        desc: '\u827a\u4eba\u7edf\u7b79\u3001\u821e\u53f0\u6267\u884c\u3001\u54c1\u724c\u8054\u5408\u4e00\u7ad9\u5f0f\u5bf9\u63a5',
        mark: 'FESTIVAL',
        tone: 'festival',
        image: '/images/home-banner-festival-live.jpg',
        type: 'festival'
      }
    ],
    texts: {
      brandName: '\u798f\u6d0b\u6587\u5316',
      brandSubtitle: '\u798f\u6d0b\u6587\u5316\u97f3\u4e50\u4eba\u5e73\u53f0',
      heroTitleLine1: '\u8ba9\u70ed\u7231\u88ab\u770b\u89c1',
      heroTitleLine2: '\u8ba9\u624d\u534e\u88ab\u6210\u5c31',
      heroDesc: '\u8fde\u63a5\u97f3\u4e50\u4e0e\u673a\u9047\uff0c\u6210\u5c31\u66f4\u5927\u7684\u821e\u53f0',
      aboutTitle: '\u5173\u4e8e\u798f\u6d0b\u6587\u5316',
      aboutText1: '\u798f\u6d0b\u6587\u5316\u662f\u4e00\u5bb6\u4e13\u6ce8\u4e8e\u97f3\u4e50\u4ea7\u4e1a\u53d1\u5c55\u7684\u521b\u65b0\u578b\u6587\u5316\u516c\u53f8\uff0c\u8fde\u63a5\u4f18\u79c0\u97f3\u4e50\u4eba\u4e0e\u884c\u4e1a\u8d44\u6e90\uff0c\u63d0\u4f9b\u827a\u4eba\u7ecf\u7eaa\u3001\u97f3\u4e50\u57f9\u8bad\u3001\u6f14\u51fa\u7b56\u5212\u3001\u97f3\u4e50\u8282\u8fd0\u8425\u7b49\u591a\u5143\u5316\u670d\u52a1\u3002',
      aboutText2: '\u6211\u4eec\u5e0c\u671b\u8ba9\u70ed\u7231\u88ab\u770b\u89c1\uff0c\u8ba9\u624d\u534e\u88ab\u6210\u5c31\uff0c\u643a\u624b\u97f3\u4e50\u4eba\u5171\u521b\u66f4\u591a\u53ef\u80fd\u3002',
      recommendedTitle: '\u5609\u5bbe\u827a\u4eba',
      allArtists: '\u5168\u90e8\u827a\u4eba',
      loading: '\u52a0\u8f7d\u4e2d...',
      noRecommended: '\u6682\u65e0\u63a8\u8350\u827a\u4eba',
      salaryLabel: '\u53c2\u8003\u85aa\u8d44\uff1a',
      noticeTitle: '\u6700\u65b0\u52a8\u6001 / \u516c\u544a',
      home: '\u9996\u9875',
      artists: '\u827a\u4eba\u5e93',
      brand: '\u54c1\u724c',
      training: '\u57f9\u8bad',
      cooperation: '\u5408\u4f5c'
    },
    entries: [
      {
        title: '\u798f\u6d0b\u827a\u4eba\u5e93',
        desc: '\u798f\u6d0b\u6587\u5316\u65d7\u4e0b\u7cbe\u9009\u827a\u4eba',
        type: 'artists-fuyang',
        tone: 'gold',
        image: '/images/home-entry-artists.jpg'
      },
      {
        title: '\u5168\u56fd\u827a\u4eba\u5e93',
        desc: '\u516c\u5f00\u5e73\u53f0 / \u5728\u7ebf\u9884\u7ea6',
        type: 'artists',
        tone: 'blue',
        image: '/images/home-entry-artists.jpg'
      },
      {
        title: '\u7b80\u5386\u6295\u653e',
        desc: '\u6b4c\u624b / \u4e50\u624b / \u6c11\u4e50 / \u821e\u8e48 / DJ / MC / \u7537\u56e2 / \u5973\u56e2\u7b49\u827a\u4eba',
        type: 'submit',
        tone: 'purple',
        image: '/images/home-entry-resume.jpg'
      },
      {
        title: '\u57f9\u8bad\u677f\u5757',
        desc: '\u96f6\u57fa\u7840\u6559\u5b66 / \u9a7b\u5531\u6b4c\u624b\u8fdb\u9636',
        type: 'training',
        tone: 'green',
        image: '/images/home-entry-training-room.jpg'
      },
      {
        title: '\u97f3\u4e50\u8282&\u5546\u6f14\u5408\u4f5c',
        desc: '\u6848\u4f8b\u5c55\u793a / \u5408\u4f5c\u65b9\u5f0f / \u5546\u52a1\u5bf9\u63a5',
        type: 'festival',
        tone: 'orange',
        image: '/images/home-entry-festival-crowd.jpg'
      },
      {
        title: '\u821e\u53f0\u8bbe\u5907\u6279\u53d1',
        desc: '\u821e\u53f0\u8bbe\u5907\u6279\u53d1\u5bf9\u63a5',
        type: 'wholesale',
        tone: 'steel',
        image: '/images/home-entry-training.jpg'
      }
    ],
    notices: [
      {
        title: '\u664b\u5347\u901a\u9053\u7533\u8bf7',
        desc: '\u821e\u53f0\u603b\u76d1\u664b\u5347\u901a\u9053\u73b0\u5df2\u5f00\u653e\uff0c\u63d0\u4ea4\u4e2a\u4eba\u80fd\u529b\u4e0e\u76ee\u6807\u804c\u4f4d\u7533\u8bf7',
        type: 'promotion'
      },
      {
        title: '免责声明',
        type: 'disclaimer',
        iconNotice: true
      }
    ]
  },

  onShow() {
    if (this.hasLoaded && this.lastLoadedAt && Date.now() - this.lastLoadedAt < 30000) {
      this.loadUnreadNotificationCount();
      return;
    }

    this.loadRecommendedArtists();
    this.loadUnreadNotificationCount();
  },

  onBannerChange(event) {
    this.setData({
      bannerIndex: event.detail.current || 0
    });
  },

  goBanner(event) {
    const type = event.currentTarget.dataset.type;

    if (type) {
      this.openEntry(type);
    }
  },

  normalizeArtist(artist) {
    const firstImage = (value) => {
      if (Array.isArray(value)) {
        return value.find(Boolean) || '';
      }

      return String(value || '')
        .split(',')
        .map((item) => item.trim())
        .find(Boolean) || '';
    };
    const coverFileID =
      firstImage(artist.art_photo_file_ids) ||
      firstImage(artist.photo_file_ids) ||
      firstImage(artist.life_photo_file_ids) ||
      artist.avatar_file_id ||
      '';

    return {
      ...artist,
      salary_display: artist.salary_display || artist.price || '\u9762\u8bae',
      cover_file_id: coverFileID,
      cover_url:
        firstImage(artist.art_photo_file_ids) ||
        firstImage(artist.art_photo_urls) ||
        firstImage(artist.photo_file_ids) ||
        firstImage(artist.photo_urls) ||
        firstImage(artist.life_photo_file_ids) ||
        firstImage(artist.life_photo_urls) ||
        artist.avatar_url ||
        '/images/home-entry-artists.jpg',
      cover_fallback_url: artist.avatar_url || '/images/home-entry-artists.jpg',
      cover_failed: false
    };
  },

  async loadRecommendedArtists() {
    this.setData({ loadingArtists: true });

    try {
      const result = await getArtists({
        featured_only: true,
        limit: 20
      });

      this.setData({
        recommendedArtists: (result.data || []).slice(0, 20).map((artist) => this.normalizeArtist(artist))
      });
      this.hasLoaded = true;
      this.lastLoadedAt = Date.now();
    } catch (error) {
      this.setData({ recommendedArtists: [] });
    } finally {
      this.setData({ loadingArtists: false });
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

  openEntry(type, extra = {}) {
    const routes = {
      artists: '/pages/artists/artists?library=nationwide',
      'artists-fuyang': '/pages/artists/artists?library=fuyang',
      submit: '/pages/submit/submit',
      customer: '/pages/customer/customer',
      festival: '/pages/festival/festival',
      wholesale: extra.category
        ? `/pages/wholesale/wholesale?category=${encodeURIComponent(extra.category)}`
        : '/pages/wholesale/wholesale'
    };

    if (routes[type]) {
      wx.navigateTo({
        url: routes[type],
        animationType: 'slide-in-right',
        animationDuration: 220
      });
      return;
    }

    wx.showToast({
      title: '\u8be5\u677f\u5757\u5c06\u5728\u540e\u7eed\u9636\u6bb5\u5f00\u653e',
      icon: 'none'
    });
  },

  goEntry(event) {
    this.openEntry(event.currentTarget.dataset.type);
  },

  goEntryLink(event) {
    this.openEntry(event.currentTarget.dataset.type, {
      category: event.currentTarget.dataset.category
    });
  },

  goDetail(event) {
    const id = event.currentTarget.dataset.id;

    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`,
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  onRecommendCoverError(event) {
    const index = Number(event.currentTarget.dataset.index);
    const artist = this.data.recommendedArtists[index];

    if (!artist) {
      return;
    }

    const fileID = artist.cover_file_id || artist.avatar_file_id;
    if (fileID && /^cloud:\/\//.test(fileID)) {
      wx.cloud.downloadFile({ fileID })
        .then((result) => {
          this.setData({
            [`recommendedArtists[${index}].cover_url`]: result.tempFilePath,
            [`recommendedArtists[${index}].cover_failed`]: true
          });
        })
        .catch(() => {
          this.setData({
            [`recommendedArtists[${index}].cover_url`]: artist.cover_fallback_url || '/images/home-entry-artists.jpg',
            [`recommendedArtists[${index}].cover_failed`]: true
          });
        });
      return;
    }

    const fallbackUrl = artist.cover_failed
      ? '/images/home-entry-artists.jpg'
      : artist.cover_fallback_url;

    this.setData({
      [`recommendedArtists[${index}].cover_url`]: fallbackUrl,
      [`recommendedArtists[${index}].cover_failed`]: true
    });
  },

  goArtists() {
    wx.navigateTo({
      url: '/pages/artists/artists',
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  onNoticeTap(event) {
    const routes = {
      promotion: '/pages/promotion/promotion',
      wholesale: '/pages/wholesale/wholesale'
    };
    const type = event.currentTarget.dataset.type;

    if (type === 'disclaimer') {
      this.setData({ showDisclaimerModal: true });
      return;
    }

    const url = routes[type];

    if (!url) {
      return;
    }

    wx.navigateTo({
      url,
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  closeDisclaimer() {
    this.setData({ showDisclaimerModal: false });
  },

  noop() {},

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

