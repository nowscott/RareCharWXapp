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
    scrollTop: 0,
    isScrolling: false,
    statusBarHeight: app.globalData.statusBarHeight,
    titleBarHeight: app.globalData.titleBarHeight,
    navHeight: app.globalData.statusBarHeightNum + app.globalData.titleBarHeightNum + 'px'
  },

  // 添加防抖定时器
  searchTimer: null,

  onLoad() {
    // 使用工具类的去重方法
    const uniqueSymbols = SymbolUtils.removeDuplicates(symbolsData.symbols);
    const categories = ['全部', ...SymbolUtils.getCategories(uniqueSymbols)];
    
    this.setData({
      allSymbols: uniqueSymbols,
      categories,
      showSymbols: SymbolUtils.shuffle([...uniqueSymbols])
    });
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
      this.filterSymbols();
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
    this.filterSymbols();
  },

  // 过滤符号
  filterSymbols() {
    const { searchText, currentCategory, allSymbols } = this.data;
    
    // 先清空当前显示的符号，触发动画重置
    this.setData({
      showSymbols: []
    });

    // 延迟50ms后显示过滤后的符号，确保动画能重新触发
    setTimeout(() => {
      const filtered = SymbolUtils.searchSymbols(
        allSymbols,
        searchText,
        currentCategory
      );
      
      this.setData({
        showSymbols: filtered
      });
    }, 50);
  },

  // 显示符号详情
  showSymbolDetail(e) {
    const symbol = e.currentTarget.dataset.symbol;
    this.setData({
      showDetail: true,
      currentSymbol: symbol
    });
  },

  // 隐藏符号详情
  hideSymbolDetail() {
    this.setData({
      showDetail: false,
      currentSymbol: null
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
  }
});
