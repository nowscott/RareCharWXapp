const StorageManager = require('./storage.js');

const UPDATE_INTERVAL = 60 * 60 * 1000; // 1小时更新间隔

const UpdateManager = {
  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },
  // 检查是否可以更新
  checkCanUpdate(lastUpdateTime) {
    const now = Date.now();
    return !lastUpdateTime || (now - lastUpdateTime) >= UPDATE_INTERVAL;
  },
  // 获取下次可更新时间
  getNextUpdateTime(lastUpdateTime) {
    return new Date(lastUpdateTime + UPDATE_INTERVAL);
  },
  // 更新数据
  updateData(callbacks = {}, hasUpdate = false) {
    const {onStart, onSuccess, onFail, onComplete} = callbacks;
    const timestamp = wx.getStorageSync('symbols_timestamp');
    if (!hasUpdate && !this.checkCanUpdate(timestamp)) {
      const nextUpdate = this.getNextUpdateTime(timestamp);
      wx.showToast({
        title: `${this.formatTime(nextUpdate)}后可更新`,
        icon: 'none',
        duration: 1000
      });
      return;
    }

    onStart?.();
    StorageManager.clearCache();
    wx.request({
      url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
      success: (res) => {
        if (res.data && res.data.symbols) {
          StorageManager.saveData(res.data);
          onSuccess?.(res.data);
          getApp().globalData.eventBus.emit('dataUpdated');
          wx.showToast({
            title: '数据已更新',
            icon: 'success'
          });
        }
      },
      fail: (err) => {
        console.error('更新数据失败:', err);
        onFail?.(err);
        wx.showToast({
          title: '更新失败',
          icon: 'error'
        });
      },
      complete: () => {
        onComplete?.();
      }
    });
  },

  // 检查更新
  checkUpdate({ onNewVersion } = {}) {
    console.log('正在检查数据更新...');
    wx.request({
      url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
      success: (res) => {
        if (res.data && res.data.version) {
          const currentVersion = StorageManager.getCurrentVersion();
          console.log('当前版本:', currentVersion, '服务器版本:', res.data.version);
          if (currentVersion !== res.data.version) {
            console.log('发现新版本！');
            onNewVersion?.(res.data.version);
          } else {
            console.log('已是最新版本');
          }
        }
      },
      fail: (err) => {
        console.error('检查更新失败:', err);
      }
    });
  }
};

module.exports = UpdateManager; 