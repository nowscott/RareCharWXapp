// index.js
const app = getApp();
const symbolsData = require('../../data/data.js');
const SymbolUtils = require('../../utils/utils.js');

Page({
  data: {
    searchText: '',
    currentCategory: '全部',
    allSymbols: [],
    showSymbols: [],
    showDetail: false,
    currentSymbol: null,
    categories: [],
    showCategories: [],
    scrollTop: 0,
    isScrolling: false,
    statusBarHeight: app.globalData.statusBarHeight,
    titleBarHeight: app.globalData.titleBarHeight,
    navHeight: app.globalData.statusBarHeightNum + app.globalData.titleBarHeightNum + 'px',
    isLoading: false
  },

  // 添加防抖定时器
  searchTimer: null,

  onLoad(options) {
    // 使用工具类的去重方法
    const uniqueSymbols = SymbolUtils.removeDuplicates(symbolsData.symbols);
    const categories = ['全部', ...SymbolUtils.getCategories(uniqueSymbols)];
    
    this.setData({
      allSymbols: uniqueSymbols,
      categories,
      showCategories: categories,
      showSymbols: SymbolUtils.shuffle([...uniqueSymbols])
    });

    // 处理分享进入的情况
    if (options.symbol) {
      const decodedSymbol = decodeURIComponent(options.symbol);
      const symbol = uniqueSymbols.find(s => s.symbol === decodedSymbol);
      if (symbol) {
        this.setData({
          showDetail: true,
          currentSymbol: symbol
        });
        // 设置导航栏标题为符号描述
        wx.setNavigationBarTitle({
          title: symbol.description
        });
      }
    }
  },

  // 搜索处理
  onSearch(e) {
    // 清除之前的定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    // 设置新的定时器，延迟300ms执行搜索
    this.searchTimer = setTimeout(() => {
      this.setData({
        searchText: e.detail.value,
        currentCategory: '全部',
        scrollTop: 0
      });
      this.filterSymbols(true);
    }, 300);
  },

  // 切换分类
  switchCategory(e) {
    if (this.data.isScrolling) {
      return;
    }

    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      scrollTop: 0
    });
    this.filterSymbols(false);
  },

  // 过滤符号
  filterSymbols(shouldUpdateCategories = true) {
    const { searchText, currentCategory, allSymbols } = this.data;
    
    this.setData({
      isLoading: true
    });

    setTimeout(() => {
      const filtered = SymbolUtils.searchSymbols(
        allSymbols,
        searchText,
        currentCategory
      );
      
      // 计算每个项目的行号
      const symbolsWithRow = filtered.map((symbol, index) => {
        const row = Math.floor(index / 2);
        return {
          ...symbol,
          style: `--row: ${row}`
        };
      });
      
      let updateData = {
        showSymbols: symbolsWithRow,
        isLoading: false
      };

      // 只在搜索时更新分类列表，切换分类时保持分类列表不变
      if (shouldUpdateCategories) {
        // 获取搜索结果中包含的所有分类
        let filteredCategories = ['全部'];
        if (searchText) {
          // 统计每个分类的数量
          const categoryCount = {};
          filtered.forEach(symbol => {
            symbol.category.forEach(cat => {
              categoryCount[cat] = (categoryCount[cat] || 0) + 1;
            });
          });

          // 转换为数组并按数量降序排序
          const orderedCategories = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)  // 按数量降序排序
            .map(([category]) => category);  // 只保留分类名

          filteredCategories = filteredCategories.concat(orderedCategories);
        } else {
          filteredCategories = this.data.categories;
        }
        updateData.showCategories = filteredCategories;
        updateData.currentCategory = '全部';
      }
      
      this.setData(updateData);
    }, 50);
  },

  // 显示符号详情
  showSymbolDetail(e) {
    const symbol = e.currentTarget.dataset.symbol;
    this.setData({
      showDetail: true,
      currentSymbol: symbol
    });
    // 设置导航栏标题为符号描述
    wx.setNavigationBarTitle({
      title: symbol.description
    });
  },

  // 隐藏符号详情
  hideSymbolDetail() {
    this.setData({
      showDetail: false,
      currentSymbol: null
    });
    // 恢复默认标题
    wx.setNavigationBarTitle({
      title: '复制符'
    });
  },

  // 添加滚动事件处理
  onSymbolScroll() {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
    }
    
    this.setData({ isScrolling: true });
    
    this.scrollTimer = setTimeout(() => {
      this.setData({ isScrolling: false });
    }, 200);
  },

  // 设置分享给朋友
  onShareAppMessage() {
    // 如果当前有打开的符号详情，就分享该符号
    if (this.data.showDetail && this.data.currentSymbol) {
      return {
        title: `${this.data.currentSymbol.symbol} - ${this.data.currentSymbol.description}`,
        path: `/pages/index/index?symbol=${encodeURIComponent(this.data.currentSymbol.symbol)}`
      }
    }
    // 否则分享首页
    return {
      title: '复制符 - 特殊符号检索工具',
      path: '/pages/index/index'
    }
  },

  // 设置分享到朋友圈
  onShareTimeline() {
    // 朋友圈分享同样支持符号参数
    if (this.data.showDetail && this.data.currentSymbol) {
      return {
        title: `${this.data.currentSymbol.symbol} - ${this.data.currentSymbol.description}`,
        query: `symbol=${encodeURIComponent(this.data.currentSymbol.symbol)}`
      }
    }
    return {
      title: '复制符 - 特殊符号检索工具'
    }
  },

  // 在按钮点击事件中调用
  onShareMenu() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  }
});
