// app.js
const EventBus = require('./utils/eventBus.js');
const StorageManager = require('./utils/storage.js');
const UpdateManager = require('./utils/update.js');

App({
  onLaunch() {
    // 定义数据获取链接
    const dataUrl = 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json';
    const betaDataUrl = 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data-beta.json';
    // 获取胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const titleTop = menuButtonInfo.top;
    const titleHeight = menuButtonInfo.height;
    const titleSize = menuButtonInfo.height - 4;
    // 判断系统
    const deviceInfo = wx.getDeviceInfo();
    const system = deviceInfo.system.toLowerCase().includes('android') ? 'android'
      : deviceInfo.system.toLowerCase().includes('ios') ? 'ios'
      : deviceInfo.system.toLowerCase().includes('windows') ? 'win'
      : deviceInfo.system.toLowerCase().includes('mac') ? 'mac' : 'other';
    console.log('系统:', system);
    // 获取小程序版本信息
    const miniProgramInfo = wx.getAccountInfoSync().miniProgram;
    console.log('小程序版本信息:', miniProgramInfo);
    // 根据版本选择数据URL
    const currentDataUrl = miniProgramInfo.envVersion === 'release' ? dataUrl : betaDataUrl;
    // 先初始化 globalData
    this.globalData = {
      statusBarHeight: titleTop + 'px',
      titleHeight: titleHeight + 'px',
      titleSize: titleSize + 'px',
      fontLoaded: false,
      eventBus: EventBus,
      system: system,
      miniProgramInfo: miniProgramInfo,
      dataUrl: currentDataUrl
    };
    // 初始化字体
    StorageManager.initFont({
      onSuccess: () => {
        this.globalData.fontLoaded = true;
      }
    });

    // 传入数据 URL
    UpdateManager.updateData({
      onSuccess: () => {
        console.log('数据更新成功');
      }
    }, currentDataUrl);
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
