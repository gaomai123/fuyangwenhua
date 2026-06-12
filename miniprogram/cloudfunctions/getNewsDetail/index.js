const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event) => {
  const id = event.id;

  if (!id) {
    return {
      success: false,
      message: '缺少动态 ID'
    };
  }

  try {
    const result = await db.collection('news').doc(id).get();
    const post = result.data;

    if (!post || post.status !== 'published') {
      return {
        success: false,
        message: '动态不存在或已隐藏'
      };
    }

    return {
      success: true,
      data: {
        ...post,
        id: post._id
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || '读取动态详情失败'
    };
  }
};
