const StorageManager = {
  // 缓存相关配置
  CACHE_KEYS: {
    SYMBOLS: 'symbols_data',
    VERSION: 'symbols_version',
    TIMESTAMP: 'symbols_timestamp',
    PINYIN: 'pinyin_map',
    PINYIN_VERSION: 'pinyin_version',
    FONT: 'font_cache'
  },

  CACHE_TIME: {
    SYMBOLS: 7 * 24 * 60 * 60 * 1000,  // 符号数据缓存7天
    PINYIN: 7 * 24 * 60 * 60 * 1000,   // 拼音映射缓存7天
    FONT: 7 * 24 * 60 * 60 * 1000,     // 字体缓存7天
    CHECK_UPDATE: 60 * 60 * 1000        // 检查更新间隔1小时
  },

  // 字体相关配置
  FONT: {
    FAMILY: 'wenkai',
    URL: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/wenkai.ttf'
  },

  // 保存数据到缓存
  saveData(data, pinyinData) {
    try {
      // 保存符号数据
      wx.setStorageSync(this.CACHE_KEYS.SYMBOLS, data);
      wx.setStorageSync(this.CACHE_KEYS.TIMESTAMP, Date.now());
      wx.setStorageSync(this.CACHE_KEYS.VERSION, data.version);

      // 如果有拼音数据，也保存
      if (pinyinData) {
        wx.setStorageSync(this.CACHE_KEYS.PINYIN, pinyinData);
        wx.setStorageSync(this.CACHE_KEYS.PINYIN_VERSION, pinyinData.version);
      }
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
        return {
          symbols: wx.getStorageSync(this.CACHE_KEYS.SYMBOLS),
          pinyin: wx.getStorageSync(this.CACHE_KEYS.PINYIN)
        };
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
      wx.removeStorageSync(this.CACHE_KEYS.PINYIN);
      wx.removeStorageSync(this.CACHE_KEYS.PINYIN_VERSION);
    } catch (e) {
      console.error('清除缓存失败:', e);
    }
  },

  // 获取当前版本
  getCurrentVersion() {
    try {
      return {
        symbols: wx.getStorageSync(this.CACHE_KEYS.VERSION),
        pinyin: wx.getStorageSync(this.CACHE_KEYS.PINYIN_VERSION)
      };
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

      // 并行获取远程数据版本
      const [symbolsRes, pinyinRes] = await Promise.all([
        this._request(getApp().globalData.dataUrl),
        this._request('https://symboldata.oss-cn-shanghai.aliyuncs.com/pinyin-map.json')
      ]);

      const currentVersions = this.getCurrentVersion();
      
      // 检查是否需要更新
      if (symbolsRes.data?.version || pinyinRes.data?.version) {
        const needUpdate = 
          currentVersions.symbols !== symbolsRes.data?.version ||
          currentVersions.pinyin !== pinyinRes.data?.version;
        
        return needUpdate ? {
          symbols: symbolsRes.data?.version,
          pinyin: pinyinRes.data?.version
        } : null;
      }
      return null;
    } catch (e) {
      console.error('检查更新失败:', e);
      return null;
    }
  },

  // 添加请求包装方法
  _request(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: resolve,
        fail: reject
      });
    });
  }
};

module.exports = StorageManager; 