// app.js
App({
  onLaunch() {
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const titleTop = menuButtonInfo.top;
    const titleHeight = menuButtonInfo.height;
    
    this.globalData = {
      statusBarHeight: titleTop + 'px',
      titleHeight: titleHeight + 'px',
    };
  },
});
