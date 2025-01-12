Component({
  data: {
    isCopying: false,
    unicodePoints: [],  // 存储所有码点
    promotionSlogan: '探索更多符号的奥秘',  // 添加推广标语
    statusBarHeight: getApp().globalData.statusBarHeight || 0,  // 从全局获取状态栏高度
    theme: 'light'  // 添加主题状态
  },

  properties: {
    show: {
      type: Boolean,
      value: false
    },
    symbol: {
      type: Object,
      value: null,
      observer: function(newVal) {
        if (newVal && newVal.symbol) {
          // 获取所有码点
          const points = Array.from(newVal.symbol).map(char => {
            const hex = char.codePointAt(0).toString(16).toUpperCase();
            return hex.padStart(4, '0');
          });
          
          this.setData({
            unicodePoints: points
          });
        }
      }
    }
  },

  methods: {
    stopPropagation() {
      return;
    },

    onClose() {
      this.triggerEvent('close');
    },

    onCopySymbol() {
      const { symbol } = this.data;
      
      // 设置复制状态
      this.setData({ isCopying: true });
      
      wx.setClipboardData({
        data: symbol.symbol,
        success: () => {
          wx.showToast({
            title: '已复制',
            icon: 'success'
          });
          // 1秒后恢复图标状态
          setTimeout(() => {
            this.setData({ isCopying: false });
          }, 1000);
          this.triggerEvent('close');
        }
      });
    },

    copyWithName() {
      const symbol = this.data.symbol;
      const text = `${symbol.symbol} - ${symbol.name}`;
      wx.setClipboardData({
        data: text,
        success: () => {
          wx.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  lifetimes: {
    attached() {
      // 监听系统主题变化
      wx.onThemeChange((result) => {
        this.setData({
          theme: result.theme
        });
      });
      
      // 获取当前主题
      try {
        const { theme = 'light' } = wx.getAppBaseInfo();
        this.setData({ theme });
      } catch (e) {
        console.error('获取主题信息失败:', e);
      }
    }
  }
}); 