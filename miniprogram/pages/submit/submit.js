const cloudApi = require('../../utils/cloud');
const { goNavTarget } = require('../../utils/nav');

const requiredFields = [
  ['stage_name', '请填写艺名'],
  ['real_name', '请填写真实姓名'],
  ['phone', '请填写手机号'],
  ['city', '请填写所在城市'],
  ['category', '请选择艺人类型']
];

const tagLabels = [
  '流行',
  '民谣',
  '摇滚',
  '爵士',
  '说唱',
  '英文',
  'R&B',
  '民族',
  '电音',
  '大嗓',
  '弹唱',
  'K-pop',
  '民舞',
  '现代舞',
  '韩舞',
  '周王陶林',
  'Hip-Hop',
  'Jazz'
];

function getInitialUploadState() {
  return {
    avatarTemp: '',
    photoTemps: [],
    videoTemps: [],
    submitting: false,
    categoryIndex: -1,
    genderIndex: -1,
    priceIndex: -1,
    selectedTags: [],
    tagOptions: tagLabels.map((label) => ({
      label,
      selected: false
    })),
    form: {
      category: '',
      gender: '',
      price: ''
    }
  };
}

function buildInitialData() {
  const state = getInitialUploadState();

  state.categoryOptions = [
    '歌手',
    '乐手',
    '民乐',
    'Dancer',
    'MC',
    '民舞舞者',
    'VJ',
    'LJ',
    '韩舞舞者',
    '嘉宾 DJ',
    '驻场DJ'
  ];
  state.genderOptions = ['男', '女', '其他'];
  state.salaryOptions = ['400-500', '500-600', '600-700'];
  state.unreadNotificationCount = 0;
  state.unreadNotificationText = '';

  return state;
}

function getFileExtension(filePath, fallback) {
  const cleanPath = String(filePath || '').split('?')[0];
  const match = cleanPath.match(/\.([a-zA-Z0-9]+)$/);

  return match ? match[1].toLowerCase() : fallback;
}

function uploadCloudFile(filePath, folder, fallbackExtension) {
  const extension = getFileExtension(filePath, fallbackExtension);
  const random = Math.random().toString(36).slice(2);
  const cloudPath = folder + '/' + Date.now() + '-' + random + '.' + extension;

  return wx.cloud.uploadFile({
    cloudPath,
    filePath
  });
}

Page({
  data: buildInitialData(),

  onShow() {
    this.loadUnreadNotificationCount();
  },

  loadUnreadNotificationCount() {
    cloudApi.getUnreadNotificationCount()
      .then((result) => {
        const count = Number((result.data || {}).count || 0);

        this.setData({
          unreadNotificationCount: count,
          unreadNotificationText: count > 99 ? '99+' : String(count)
        });
      })
      .catch(() => {
        this.setData({
          unreadNotificationCount: 0,
          unreadNotificationText: ''
        });
      });
  },

  validate(values) {
    for (let index = 0; index < requiredFields.length; index += 1) {
      const field = requiredFields[index][0];
      const message = requiredFields[index][1];

      if (!String(values[field] || '').trim()) {
        wx.showToast({ title: message, icon: 'none' });
        return false;
      }
    }

    return true;
  },

  resetUploadState() {
    this.setData(getInitialUploadState());
  },

  onPickerChange(event) {
    const field = event.currentTarget.dataset.field;
    const index = Number(event.detail.value);
    const optionMap = {
      category: this.data.categoryOptions,
      gender: this.data.genderOptions,
      price: this.data.salaryOptions
    };
    const option = optionMap[field] ? optionMap[field][index] : '';
    const patch = {};

    patch[field + 'Index'] = index;
    patch['form.' + field] = option || '';
    this.setData(patch);
  },

  toggleTag(event) {
    const index = Number(event.currentTarget.dataset.index);
    const tagOptions = this.data.tagOptions.map((item) => ({ ...item }));
    const option = tagOptions[index];

    if (!option) {
      return;
    }

    if (!option.selected && this.data.selectedTags.length >= 5) {
      wx.showToast({
        title: '最多选择 5 个风格标签',
        icon: 'none'
      });
      return;
    }

    option.selected = !option.selected;

    this.setData({
      tagOptions,
      selectedTags: tagOptions.filter((item) => item.selected).map((item) => item.label)
    });
  },

  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        this.setData({ avatarTemp: result.tempFilePaths[0] });
      }
    });
  },

  choosePhotos() {
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        this.setData({ photoTemps: result.tempFilePaths });
      }
    });
  },

  chooseVideo() {
    const remain = 5 - this.data.videoTemps.length;

    if (remain <= 0) {
      wx.showToast({
        title: '最多上传 5 条视频',
        icon: 'none'
      });
      return;
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['video'],
      sourceType: ['album', 'camera'],
      maxDuration: 90,
      success: (result) => {
        const videos = (result.tempFiles || []).map((item) => {
          const filePath = item.tempFilePath || '';
          const parts = filePath.split('/');

          return {
            filePath,
            name: parts[parts.length - 1] || 'video'
          };
        }).filter((item) => item.filePath);

        this.setData({
          videoTemps: this.data.videoTemps.concat(videos).slice(0, 5)
        });
      }
    });
  },

  removeVideo(event) {
    const index = Number(event.currentTarget.dataset.index);
    const videoTemps = this.data.videoTemps.filter((_, itemIndex) => itemIndex !== index);

    this.setData({ videoTemps });
  },

  uploadAvatarIfNeeded() {
    if (!this.data.avatarTemp) {
      return Promise.resolve('');
    }

    return uploadCloudFile(this.data.avatarTemp, 'avatars', 'jpg').then((result) => result.fileID);
  },

  uploadPhotosIfNeeded() {
    const tasks = [];

    for (let index = 0; index < this.data.photoTemps.length; index += 1) {
      tasks.push(uploadCloudFile(this.data.photoTemps[index], 'artist-photos', 'jpg').then((result) => result.fileID));
    }

    return Promise.all(tasks);
  },

  uploadVideosIfNeeded() {
    const tasks = [];

    for (let index = 0; index < this.data.videoTemps.length; index += 1) {
      tasks.push(uploadCloudFile(this.data.videoTemps[index].filePath, 'artist-videos', 'mp4').then((result) => result.fileID));
    }

    return Promise.all(tasks);
  },

  submitProfile(event) {
    const values = Object.assign({}, event.detail.value, {
      category: this.data.form.category,
      gender: this.data.form.gender,
      price: this.data.form.price
    });

    if (!this.validate(values)) {
      return;
    }

    this.setData({ submitting: true });

    Promise.all([
      this.uploadAvatarIfNeeded(),
      this.uploadPhotosIfNeeded(),
      this.uploadVideosIfNeeded()
    ])
      .then((results) => {
        const profile = Object.assign({}, values, {
          tags: this.data.selectedTags,
          avatar_file_id: results[0],
          photo_file_ids: results[1],
          video_file_ids: results[2],
          video_file_id: results[2][0] || '',
          video_url: values.video_url
        });

        return cloudApi.submitArtist(profile);
      })
      .then(() => {
        this.resetUploadState();
        this.setData({ submitting: false });
        wx.redirectTo({ url: '/pages/success/success' });
      })
      .catch((error) => {
        this.setData({ submitting: false });
        wx.showModal({
          title: '提交失败',
          content: error.message,
          showCancel: false
        });
      });
  },

  goNav(event) {
    const target = event.currentTarget.dataset.target;
    goNavTarget(target);
  }
});
