App({
  onLaunch() {
    wx.setBackgroundColor({
      backgroundColor: '#0a111b',
      backgroundColorTop: '#0a111b',
      backgroundColorBottom: '#07101c'
    });

    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d6gpw3i9686e94bf4',
        traceUser: true
      });
    }
  },

  onShow() {
    wx.setBackgroundColor({
      backgroundColor: '#0a111b',
      backgroundColorTop: '#0a111b',
      backgroundColorBottom: '#07101c'
    });
  },

  globalData: {
    apiBase: 'http://192.168.22.157:3001/api'
  }
});
