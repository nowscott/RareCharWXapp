Component({
  data: {
    isCopying: false,
    unicodePoints: [],
    promotionSlogan: '复制符 - 探索更多符号的奥秘',
    statusBarHeight: getApp().globalData.statusBarHeight || 0, 
    theme: 'light'
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
      // 阻止事件冒泡
      return;
    },

    handleMaskTap(e) {
      // 检查点击是否在蒙层上
      if (e.target.id === 'mask') {
        this.setData({ show: false });
        // 等待动画结束后再触发关闭事件
        setTimeout(() => {
          this.triggerEvent('close');
        }, 300);
      }
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