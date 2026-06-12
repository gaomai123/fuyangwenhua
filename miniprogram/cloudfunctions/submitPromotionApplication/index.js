const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const targetPositions = ['单店舞台总监', '小区域舞台总监', '大区域舞台总监'];

function cleanString(value) {
  return String(value || '').trim();
}

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext();
  const input = event.application || {};
  const data = {
    name: cleanString(input.name),
    age: Number(input.age),
    gender: cleanString(input.gender),
    phone: cleanString(input.phone),
    store: cleanString(input.store),
    current_position: cleanString(input.current_position),
    target_position: cleanString(input.target_position),
    ability_statement: cleanString(input.ability_statement)
  };

  if (!data.name || !data.gender || !data.phone || !data.store || !data.current_position || !data.ability_statement) {
    return { success: false, message: '请完整填写晋升申请' };
  }
  if (!Number.isInteger(data.age) || data.age < 16 || data.age > 70) {
    return { success: false, message: '年龄填写不正确' };
  }
  if (!/^1\d{10}$/.test(data.phone)) {
    return { success: false, message: '联系方式填写不正确' };
  }
  if (!targetPositions.includes(data.target_position)) {
    return { success: false, message: '目标晋升职位不正确' };
  }

  try {
    const result = await db.collection('promotion_applications').add({
      data: {
        ...data,
        openid: wxContext.OPENID,
        status: 'pending',
        review_note: '',
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }
    });
    return {
      success: true,
      data: { id: result._id, status: 'pending' }
    };
  } catch (error) {
    return { success: false, message: error.message || '提交晋升申请失败' };
  }
};
