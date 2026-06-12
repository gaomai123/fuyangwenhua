const { submitPromotionApplication } = require('../../utils/cloud');

const targetPositions = [
  '单店舞台总监',
  '小区域舞台总监',
  '大区域舞台总监'
];

Page({
  data: {
    form: {
      name: '',
      age: '',
      gender: '',
      phone: '',
      store: '',
      currentPosition: '',
      abilityStatement: ''
    },
    genderOptions: ['男', '女'],
    genderIndex: -1,
    targetPositions,
    targetIndex: -1,
    submitting: false
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: event.detail.value });
  },

  onGenderChange(event) {
    const genderIndex = Number(event.detail.value);
    this.setData({
      genderIndex,
      'form.gender': this.data.genderOptions[genderIndex]
    });
  },

  onTargetChange(event) {
    this.setData({ targetIndex: Number(event.detail.value) });
  },

  async submitApplication() {
    const { form, targetIndex, targetPositions, submitting } = this.data;
    if (submitting) return;

    const requiredFields = [
      ['name', '请填写名字'],
      ['age', '请填写年龄'],
      ['gender', '请选择性别'],
      ['phone', '请填写联系方式'],
      ['store', '请填写所在门店'],
      ['currentPosition', '请填写现任职位'],
      ['abilityStatement', '请填写能力自诉']
    ];

    for (const [field, message] of requiredFields) {
      if (!String(form[field] || '').trim()) {
        wx.showToast({ title: message, icon: 'none' });
        return;
      }
    }

    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 16 || age > 70) {
      wx.showToast({ title: '请填写正确年龄', icon: 'none' });
      return;
    }

    if (!/^1\d{10}$/.test(form.phone.trim())) {
      wx.showToast({ title: '请填写正确手机号', icon: 'none' });
      return;
    }

    if (targetIndex < 0) {
      wx.showToast({ title: '请选择目标晋升职位', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      await submitPromotionApplication({
        name: form.name,
        age,
        gender: form.gender,
        phone: form.phone,
        store: form.store,
        current_position: form.currentPosition,
        target_position: targetPositions[targetIndex],
        ability_statement: form.abilityStatement
      });
      wx.redirectTo({ url: '/pages/success/success?type=promotion' });
    } catch (error) {
      wx.showToast({ title: error.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
