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
      statusBarHeight: statusBarHeight + 'px',
      titleBarHeight: titleBarHeight + 'px',
      tabBarHeight: tabBarHeight + 'px',
      pageHeight: pageHeight + 'px',
      pageTopy: pageTopy + 'px',
      statusBarHeightNum: statusBarHeight,
      titleBarHeightNum: titleBarHeight
    };
  }
})
