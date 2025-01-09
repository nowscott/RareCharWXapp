// app.js
App({
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const tabBarHeight = systemInfo.screenHeight - systemInfo.windowHeight - statusBarHeight;
    const menuButton = wx.getMenuButtonBoundingClientRect();
    const titleBarHeight = menuButton.bottom - menuButton.top + 2 * (menuButton.top - statusBarHeight);
    const pageHeight = systemInfo.screenHeight + titleBarHeight;
    const pageTopy = statusBarHeight + titleBarHeight;

    this.globalData = {
      version: '1.0.0',
      statusBarHeight: statusBarHeight + 'px',
      titleBarHeight: titleBarHeight + 'px',
      tabBarHeight: tabBarHeight + 'px',
      pageHeight: pageHeight + 'px',
      pageTopy: pageTopy + 'px',
      // 保存原始数值，方便计算
      statusBarHeightNum: statusBarHeight,
      titleBarHeightNum: titleBarHeight
    };
  }
})
