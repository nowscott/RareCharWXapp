// app.js
const EventBus = require('./utils/eventBus.js');
const StorageManager = require('./utils/storage.js');

App({
  onLaunch() {
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const titleTop = menuButtonInfo.top;
    const titleHeight = menuButtonInfo.height;
    const titleSize = menuButtonInfo.height - 4;
    // 先初始化 globalData
    this.globalData = {
      statusBarHeight: titleTop + 'px',
      titleHeight: titleHeight + 'px',
      titleSize: titleSize + 'px',
      fontLoaded: false,
      eventBus: EventBus
    };
    // 初始化字体
    StorageManager.initFont({
      onSuccess: () => {
        this.globalData.fontLoaded = true;
      }
    });
    // 检查小程序更新
    this.checkForUpdate();
  },

  // 检查小程序更新
  checkForUpdate() {
    const updateManager = wx.getUpdateManager();

    updateManager.onCheckForUpdate((res) => {
      if (res.hasUpdate) {
        wx.showToast({
          title: '发现新版本',
          icon: 'none',
          duration: 2000
        });
      }
    });

    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate();
          }
        }
      });
    });

    updateManager.onUpdateFailed(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败，请检查网络后重试',
        showCancel: false
      });
    });
  }
});
