// app.js
App({
  onLaunch() {
    // 获取窗口信息
    const windowInfo = wx.getWindowInfo();
    // 获取设备信息
    const deviceInfo = wx.getDeviceInfo();
    // 获取基础信息
    const appBaseInfo = wx.getAppBaseInfo();
    
    // 计算导航栏高度
    this.globalData = {
      statusBarHeight: windowInfo.statusBarHeight + 'px',
      titleBarHeight: deviceInfo.brand === 'iPhone' ? '44px' : '48px',
      statusBarHeightNum: windowInfo.statusBarHeight,
      titleBarHeightNum: deviceInfo.brand === 'iPhone' ? 44 : 48,
      theme: appBaseInfo.theme,
      platform: deviceInfo.platform,
      brand: deviceInfo.brand
    };
  },
  globalData: {
    statusBarHeight: '',
    titleBarHeight: '',
    statusBarHeightNum: 0,
    titleBarHeightNum: 0
  }
});
