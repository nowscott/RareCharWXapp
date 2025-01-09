Component({
  data: {
    isCopying: false,
    unicodePoints: []  // 存储所有码点
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
    }
  }
}); 