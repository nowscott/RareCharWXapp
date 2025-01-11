// app.js
const EventBus = require('./utils/eventBus.js');

App({
  onLaunch() {
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const titleTop = menuButtonInfo.top;
    const titleHeight = menuButtonInfo.height;
    
    this.globalData = {
      statusBarHeight: titleTop + 'px',
      titleHeight: titleHeight + 'px',
      eventBus: EventBus
    };

    // 检查小程序更新
    this.checkForUpdate();
  },

  // 检查小程序更新
  checkForUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      console.log('有新版本？', res.hasUpdate);
    });

    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，请重启应用',
        showCancel: false,
        success(res) {
          // 用户点击确定后强制更新
          updateManager.applyUpdate();
        }
      });
    });

    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false
      });
    });
  }
});
