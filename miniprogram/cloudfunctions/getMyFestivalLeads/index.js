const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const statusLabelMap = {
  pending: '待处理',
  contacted: '已联系',
  closed: '已关闭'
};

function normalizeLead(lead) {
  return {
    ...lead,
    id: lead._id,
    status_label: statusLabelMap[lead.status] || lead.status || '-'
  };
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    const result = await db
      .collection('festival_leads')
      .where({
        openid: wxContext.OPENID
      })
      .limit(100)
      .get();

    return {
      success: true,
      data: result.data.map(normalizeLead)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取音乐节合作申请失败'
    };
  }
};
