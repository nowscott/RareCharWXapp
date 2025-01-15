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
    FONT: 7 * 24 * 60 * 60 * 1000      // 字体缓存7天
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
      if (data?.symbols && data?.version) {
        wx.setStorageSync(this.CACHE_KEYS.SYMBOLS, data);
        wx.setStorageSync(this.CACHE_KEYS.TIMESTAMP, Date.now());
        wx.setStorageSync(this.CACHE_KEYS.VERSION, data.version);
      } else {
        console.warn('Invalid symbols data:', data);
      }

      // 保存拼音数据
      if (pinyinData?.pinyinMap && pinyinData?.version) {
        wx.setStorageSync(this.CACHE_KEYS.PINYIN, pinyinData);
        wx.setStorageSync(this.CACHE_KEYS.PINYIN_VERSION, pinyinData.version);
      } else {
        console.warn('Invalid pinyin data:', pinyinData);
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
        const symbolsData = wx.getStorageSync(this.CACHE_KEYS.SYMBOLS);
        const pinyinData = wx.getStorageSync(this.CACHE_KEYS.PINYIN);
        // 确保数据有效
        if (symbolsData?.symbols) {
          return {
            symbols: symbolsData,
            pinyin: pinyinData?.pinyinMap ? pinyinData : null
          };
        }
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

  // 添加请求包装方法
  _request(url) {
    if (!url) {
      console.error('请求 URL 不能为空');
      return Promise.reject(new Error('Invalid URL'));
    }

    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    const urlWithTimestamp = `${url}${separator}t=${timestamp}`;

    return new Promise((resolve, reject) => {
      wx.request({
        url: urlWithTimestamp,
        enableCache: false,
        header: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        success: resolve,
        fail: reject
      });
    });
  }
};

module.exports = StorageManager; 