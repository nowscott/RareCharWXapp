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
      desc: {
        style: 'normal',
        weight: 'normal',
        variant: 'normal'
      },
      timeout: 5000,
      success: (res) => {
        console.log('字体加载成功:', res);
        this.setPageFontLoaded();
      },
      fail: (err) => {
        console.error('字体加载失败:', err);
        // 即使失败也设置字体加载状态，避免界面卡住
        this.setPageFontLoaded();
        this.updateFontCache();
      },
      complete: () => {
        // 无论成功失败都更新缓存
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
      wx.setStorageSync(this.CACHE_KEY, {
        timestamp: Date.now(),
        family: this.FONT_FAMILY
      });
    } catch (e) {
      console.error('更新字体缓存失败:', e);
    }
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