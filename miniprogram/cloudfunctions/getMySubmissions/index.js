const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const statusLabelMap = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
};

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.join('、');
  }

  return tags || '';
}

function normalizeSubmission(item) {
  return {
    ...item,
    id: item._id,
    tags: normalizeTags(item.tags),
    status_label: statusLabelMap[item.status] || item.status || '-',
    is_converted: item.status === 'approved',
    identity_type: item.category || normalizeTags(item.tags) || '音乐人'
  };
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();

  try {
    const result = await db
      .collection('artists')
      .where({
        openid: wxContext.OPENID
      })
      .limit(100)
      .get();

    return {
      success: true,
      data: result.data.map(normalizeSubmission)
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取提交状态失败'
    };
  }
};
