const StorageManager = {
  // 缓存相关配置
  CACHE_KEYS: {
    SYMBOLS: 'symbols_data',
    VERSION: 'symbols_version',
    TIMESTAMP: 'symbols_timestamp',
    FONT: 'font_cache'
  },

  CACHE_TIME: {
    SYMBOLS: 7 * 24 * 60 * 60 * 1000,  // 符号数据缓存7天
    FONT: 7 * 24 * 60 * 60 * 1000, // 字体缓存7天
    CHECK_UPDATE: 60 * 60 * 1000    // 检查更新间隔1小时
  },

  // 字体相关配置
  FONT: {
    FAMILY: 'wenkai',
    URL: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/wenkai.ttf'
  },

  // 保存数据到缓存
  saveData(data) {
    try {
      wx.setStorageSync(this.CACHE_KEYS.SYMBOLS, data);
      wx.setStorageSync(this.CACHE_KEYS.TIMESTAMP, Date.now());
      wx.setStorageSync(this.CACHE_KEYS.VERSION, data.version);
    } catch (e) {
      console.error('缓存数据失败:', e);
    }
  },

  // 获取缓存的数据
  getData() {
    try {
      const timestamp = wx.getStorageSync(this.CACHE_KEYS.TIMESTAMP);
      const now = Date.now();
      
      if (timestamp && (now - timestamp < this.CACHE_TIME.SYMBOLS)) {
        return wx.getStorageSync(this.CACHE_KEYS.SYMBOLS);
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
      wx.removeStorageSync(this.CACHE_KEYS.SYMBOLS);
      wx.removeStorageSync(this.CACHE_KEYS.TIMESTAMP);
      wx.removeStorageSync(this.CACHE_KEYS.VERSION);
    } catch (e) {
      console.error('清除缓存失败:', e);
    }
  },

  // 获取当前版本
  getCurrentVersion() {
    try {
      return wx.getStorageSync(this.CACHE_KEYS.VERSION);
    } catch (e) {
      console.error('获取版本失败:', e);
      return null;
    }
  },

  // 字体相关方法
  // 检查字体缓存
  checkFontCache() {
    const fontCache = wx.getStorageSync(this.CACHE_KEYS.FONT);
    const now = Date.now();
    if (fontCache && (now - fontCache.timestamp < this.CACHE_TIME.FONT)) {
      this.loadFontFace();
      return true;
    }
    return false;
  },

  // 加载字体
  loadFontFace() {
    wx.loadFontFace({
      global: true,
      family: this.FONT.FAMILY,
      source: this.FONT.URL,
      desc: {
        style: 'normal',
        weight: 'normal',
        variant: 'normal'
      },
      timeout: 5000,
      success: () => {
        console.log('字体加载成功');
        this.setPageFontLoaded();
      },
      fail: (err) => {
        console.error('字体加载失败:', err);
        this.setPageFontLoaded();
        this.updateFontCache();
      },
      complete: () => {
        this.updateFontCache();
      }
    });
  },

  // 设置页面字体加载状态
  setPageFontLoaded() {
    try {
      const pages = getCurrentPages();
      pages.forEach(page => {
        if (page && page.setData) {
          page.setData({
            fontLoaded: true
          });
        }
      });
    } catch (e) {
      console.error('设置字体状态失败:', e);
    }
  },

  // 更新字体缓存
  updateFontCache() {
    try {
      wx.setStorageSync(this.CACHE_KEYS.FONT, {
        timestamp: Date.now(),
        family: this.FONT.FAMILY
      });
    } catch (e) {
      console.error('更新字体缓存失败:', e);
    }
  },

  // 初始化字体
  initFont(callbacks = {}) {
    const { onSuccess, onFail } = callbacks;

    if (this.checkFontCache()) {
      onSuccess?.();
      return;
    }

    this.loadFontFace();
    this.updateFontCache();
    onSuccess?.();
  },

  // 检查更新
  async checkUpdate() {
    try {
      const lastCheck = wx.getStorageSync('last_update_check');
      const now = Date.now();

      // 如果距离上次检查时间不足间隔时间，则跳过
      if (lastCheck && (now - lastCheck < this.CACHE_TIME.CHECK_UPDATE)) {
        return null;
      }

      // 记录本次检查时间
      wx.setStorageSync('last_update_check', now);

      // 获取远程数据版本
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
          success: resolve,
          fail: reject
        });
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

module.exports = StorageManager; 