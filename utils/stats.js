const StatsManager = {
  // 获取统计数据
  fetchStatsData(callbacks = {}) {
    const { onSuccess, onFail } = callbacks;

    wx.request({
      url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
      success: (res) => {
        if(res.data && res.data.symbols) {
          const stats = this.calculateStats(res.data.symbols);
          onSuccess?.(stats);
        }
      },
      fail: (err) => {
        console.error('获取统计数据失败:', err);
        onFail?.(err);
        wx.showToast({
          title: '统计数据加载失败',
          icon: 'none'
        });
      }
    });
  },

  // 计算统计数据
  calculateStats(symbols) {
    // 统计分类数量
    const categoryCount = {};
    symbols.forEach(symbol => {
      if(Array.isArray(symbol.category)) {
        symbol.category.forEach(cat => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      }
    });
    
    // 获取前3个最多的分类
    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({category, count}));
    
    return {
      total: symbols.length,
      topCategories
    };
  }
};

module.exports = StatsManager; 