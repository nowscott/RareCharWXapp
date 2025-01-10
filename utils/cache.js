// 新建 cache.js 文件来管理缓存
const CACHE_KEY = {
  SYMBOLS: 'symbols_data',
  VERSION: 'symbols_version',
  TIMESTAMP: 'symbols_timestamp'
};

const CACHE_TIME = 24 * 60 * 60 * 1000; // 缓存24小时
const CHECK_UPDATE_INTERVAL = 60 * 60 * 1000; // 每小时检查一次更新

const CacheManager = {
  // 保存数据到缓存
  saveData(data) {
    try {
      wx.setStorageSync(CACHE_KEY.SYMBOLS, data);
      wx.setStorageSync(CACHE_KEY.TIMESTAMP, Date.now());
      wx.setStorageSync(CACHE_KEY.VERSION, data.version);
    } catch (e) {
      console.error('缓存数据失败:', e);
    }
  },

  // 获取缓存的数据
  getData() {
    try {
      const timestamp = wx.getStorageSync(CACHE_KEY.TIMESTAMP);
      const now = Date.now();
      
      // 检查缓存是否过期
      if (timestamp && (now - timestamp < CACHE_TIME)) {
        return wx.getStorageSync(CACHE_KEY.SYMBOLS);
      }
      return null;
    } catch (e) {
      console.error('读取缓存失败:', e);
      return null;
    }
  },

  // 清除缓存
  clearCache() {
    try {
      wx.removeStorageSync(CACHE_KEY.SYMBOLS);
      wx.removeStorageSync(CACHE_KEY.TIMESTAMP);
      wx.removeStorageSync(CACHE_KEY.VERSION);
    } catch (e) {
      console.error('清除缓存失败:', e);
    }
  },

  // 获取当前版本
  getCurrentVersion() {
    try {
      return wx.getStorageSync(CACHE_KEY.VERSION);
    } catch (e) {
      console.error('获取版本失败:', e);
      return null;
    }
  },

  // 检查更新
  async checkUpdate() {
    try {
      const lastCheck = wx.getStorageSync('last_update_check');
      const now = Date.now();

      // 如果距离上次检查时间不足间隔时间，则跳过
      if (lastCheck && (now - lastCheck < CHECK_UPDATE_INTERVAL)) {
        return null;
      }

      // 记录本次检查时间
      wx.setStorageSync('last_update_check', now);

      // 获取远程数据版本
      const res = await wx.request({
        url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json'
      });

      if (res.data && res.data.version) {
        const currentVersion = this.getCurrentVersion();
        return currentVersion !== res.data.version ? res.data.version : null;
      }
      return null;
    } catch (e) {
      console.error('检查更新失败:', e);
      return null;
    }
  }
};

module.exports = CacheManager; 