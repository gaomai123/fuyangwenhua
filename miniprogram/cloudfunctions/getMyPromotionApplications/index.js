const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const statusLabels = {
  pending: '待处理',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '未通过'
};

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  try {
    const result = await db.collection('promotion_applications')
      .where({ openid: wxContext.OPENID })
      .limit(100)
      .get();
    return {
      success: true,
      data: result.data.map((item) => ({
        ...item,
        id: item._id,
        status_label: statusLabels[item.status] || item.status || '-'
      }))
    };
  } catch (error) {
    return { success: false, message: error.message || '读取晋升申请失败' };
  }
};
