const {
  getUserProfile,
  saveUserProfile,
  getUnreadNotificationCount
} = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

Page({
  data: {
    profileLoading: true,
    profileSaving: false,
    showProfileEditor: false,
    userInitial: '我',
    userProfile: {
      nickname: '微信用户',
      avatar_url: '',
      profile_completed: false
    },
    profileForm: {
      nickname: '',
      avatar_url: ''
    },
    unreadNotificationCount: 0,
    unreadNotificationText: ''
  },

  onShow() {
    this.loadUserProfile();
    this.loadUnreadNotificationCount();
  },

  async loadUserProfile() {
    this.setData({ profileLoading: true });

    try {
      const result = await getUserProfile();
      const profile = result.data || {};
      const nickname = profile.nickname || '微信用户';

      this.setData({
        userProfile: profile,
        userInitial: nickname.slice(0, 1) || '我',
        profileForm: {
          nickname: profile.profile_completed ? nickname : '',
          avatar_url: profile.avatar_url || ''
        }
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '微信登录失败',
        icon: 'none'
      });
    } finally {
      this.setData({ profileLoading: false });
    }
  },

  toggleProfileEditor() {
    const showProfileEditor = !this.data.showProfileEditor;
    const profile = this.data.userProfile;

    this.setData({
      showProfileEditor,
      profileForm: showProfileEditor
        ? {
            nickname: profile.profile_completed ? profile.nickname : '',
            avatar_url: profile.avatar_url || ''
          }
        : this.data.profileForm
    });
  },

  onChooseAvatar(event) {
    this.setData({
      'profileForm.avatar_url': event.detail.avatarUrl || ''
    });
  },

  onNicknameInput(event) {
    this.setData({
      'profileForm.nickname': event.detail.value || ''
    });
  },

  async uploadProfileAvatar(tempPath) {
    if (!tempPath || tempPath.startsWith('cloud://') || tempPath.startsWith('http')) {
      return tempPath || '';
    }

    const extension = (tempPath.match(/\.[a-zA-Z0-9]+$/) || ['.jpg'])[0];
    const cloudPath = `user-avatars/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    const result = await wx.cloud.uploadFile({
      cloudPath,
      filePath: tempPath
    });

    return result.fileID;
  },

  async saveProfile() {
    if (this.data.profileSaving) {
      return;
    }

    const nickname = String(this.data.profileForm.nickname || '').trim();

    if (!nickname) {
      wx.showToast({
        title: '请填写微信昵称',
        icon: 'none'
      });
      return;
    }

    this.setData({ profileSaving: true });

    try {
      const avatarUrl = await this.uploadProfileAvatar(this.data.profileForm.avatar_url);
      const result = await saveUserProfile({
        nickname,
        avatar_url: avatarUrl
      });
      const profile = result.data || {};

      this.setData({
        userProfile: profile,
        userInitial: (profile.nickname || '我').slice(0, 1),
        profileForm: {
          nickname: profile.nickname || '',
          avatar_url: profile.avatar_url || ''
        },
        showProfileEditor: false
      });

      wx.showToast({
        title: '资料已保存',
        icon: 'success'
      });
    } catch (error) {
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none'
      });
    } finally {
      this.setData({ profileSaving: false });
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

  goSubmit() {
    wx.navigateTo({
      url: '/pages/submit/submit',
      animationType: 'slide-in-right',
      animationDuration: 220,
      fail() {
        wx.redirectTo({ url: '/pages/submit/submit' });
      }
    });
  },

  goArtistLibrary() {
    wx.navigateTo({
      url: '/pages/artists/artists',
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  goMyArtist() {
    wx.navigateTo({
      url: '/pages/my-artist/my-artist',
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  goPromotion() {
    wx.navigateTo({
      url: '/pages/promotion/promotion',
      animationType: 'slide-in-right',
      animationDuration: 220
    });
  },

  contactService() {
    wx.showModal({
      title: '联系客服',
      content: '请联系福洋文化工作人员，或在后续版本接入在线客服。',
      showCancel: false
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
