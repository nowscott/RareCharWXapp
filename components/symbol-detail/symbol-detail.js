copyWithDesc() {
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
}, 