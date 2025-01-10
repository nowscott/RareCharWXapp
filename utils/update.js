const CacheManager = require('./cache.js');

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
  updateData(callbacks = {}) {
    const {onStart, onSuccess, onFail, onComplete} = callbacks;
    
    const timestamp = wx.getStorageSync('symbols_timestamp');
    if (!this.checkCanUpdate(timestamp)) {
      const nextUpdate = this.getNextUpdateTime(timestamp);
      wx.showToast({
        title: `${this.formatTime(nextUpdate)}后可更新`,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    onStart?.();
    CacheManager.clearCache();

    wx.request({
      url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
      success: (res) => {
        if (res.data && res.data.symbols) {
          CacheManager.saveData(res.data);
          onSuccess?.(res.data);
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
  async checkUpdate(callbacks = {}) {
    const {onNewVersion} = callbacks;
    const newVersion = await CacheManager.checkUpdate();
    if (newVersion) {
      onNewVersion?.(newVersion);
    }
    return newVersion;
  }
};

module.exports = UpdateManager; 