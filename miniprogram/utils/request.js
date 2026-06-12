const app = getApp();

function buildError(prefix, response, fallback) {
  const data = response && response.data ? response.data : {};
  const message = data.message || fallback;
  const statusCode = response ? response.statusCode : '';

  return new Error(`${prefix}${statusCode ? `(${statusCode})` : ''}: ${message}`);
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.apiBase}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(options.header || {})
      },
      success(response) {
        const data = response.data || {};

        if (response.statusCode >= 200 && response.statusCode < 300 && data.success) {
          resolve(data);
          return;
        }

        reject(buildError('请求失败', response, '请检查后端接口'));
      },
      fail(error) {
        reject(new Error(`网络请求失败: ${error.errMsg || '请检查后端是否启动、手机和电脑是否在同一网络'}`));
      }
    });
  });
}

function uploadFile(options) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${app.globalData.apiBase}${options.url}`,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: options.formData || {},
      success(response) {
        let data = {};

        try {
          data = JSON.parse(response.data || '{}');
        } catch (error) {
          reject(new Error('上传失败: 服务器返回内容无法解析'));
          return;
        }

        if (response.statusCode >= 200 && response.statusCode < 300 && data.success) {
          resolve(data);
          return;
        }

        reject(buildError('上传失败', { ...response, data }, '请检查文件格式和大小'));
      },
      fail(error) {
        reject(new Error(`上传失败: ${error.errMsg || '请检查后端是否启动、手机和电脑是否在同一网络'}`));
      }
    });
  });
}

module.exports = {
  request,
  uploadFile
};
