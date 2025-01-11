const FontManager = {
  CACHE_KEY: 'fontCache',
  CACHE_TIME: 7 * 24 * 60 * 60 * 1000, // 7天缓存
  FONT_FAMILY: 'wenkai',
  FONT_URL: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/wenkai.ttf',

  // 检查字体缓存
  checkFontCache() {
    const fontCache = wx.getStorageSync(this.CACHE_KEY);
    const now = Date.now();
    if (fontCache && (now - fontCache.timestamp < this.CACHE_TIME)) {
      // 有缓存时也需要加载字体
      this.loadFontFace();
      return true;
    }
    return false;
  },

  // 实际加载字体的方法
  loadFontFace() {
    wx.loadFontFace({
      global: true,
      family: this.FONT_FAMILY,
      source: this.FONT_URL,
      timeout: 5000,
      desc: {
        style: 'normal',
        weight: 'normal'
      },
      success: (res) => {
        this.setPageFontLoaded();
      },
      fail: (err) => {
        console.error('字体加载失败:', err);
        this.updateFontCache();
      }
    });
  },

  // 设置页面字体加载状态
  setPageFontLoaded() {
    const pages = getCurrentPages();
    pages.forEach(page => {
      page.setData({
        fontLoaded: true
      });
    });
  },

  // 更新字体缓存
  updateFontCache() {
    wx.setStorageSync(this.CACHE_KEY, {
      timestamp: Date.now(),
      family: this.FONT_FAMILY
    });
  },

  // 加载字体
  loadFont(callbacks = {}) {
    const { onSuccess, onFail } = callbacks;

    if (this.checkFontCache()) {
      onSuccess?.();
      return;
    }

    this.loadFontFace();
    this.updateFontCache();
    onSuccess?.();
  }
};

module.exports = FontManager; 