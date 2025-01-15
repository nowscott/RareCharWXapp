// index.js
const app = getApp();
const SymbolUtils = require('../../utils/utils.js');
const StorageManager = require('../../utils/storage.js');

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
    statusBarHeight: app.globalData.statusBarHeight,
    titleHeight: app.globalData.titleHeight,
    titleSize: app.globalData.titleSize,
    isLoading: true,
    isScrolling: false,
    scrollTimer: null
  },
  
  onLoad() {
    const system = getApp().globalData.system;
    // 尝试加载缓存数据
    const initialData = SymbolUtils.handleInitialData(system);
    if (initialData) {
      this.setData(SymbolUtils.processInitialData(initialData));
    } else {
      this.fetchSymbolsData();
    }
    // 监听数据更新事件
    this.onDataUpdate = () => this.fetchSymbolsData();
    getApp().globalData.eventBus.on('dataUpdated', this.onDataUpdate);
  },

  onUnload() {
    if (this.onDataUpdate) {
      getApp().globalData.eventBus.off('dataUpdated', this.onDataUpdate);
    }
  },

  fetchSymbolsData() {
    const system = getApp().globalData.system;
    const cachedData = StorageManager.getData();
    if (cachedData) {
      const processedData = SymbolUtils.handleInitialData(system);
      this.setData(SymbolUtils.processInitialData(processedData));
      return;
    }
    SymbolUtils.fetchData({
      onSuccess: (data) => {
        StorageManager.saveData(data);
        const processedData = SymbolUtils.handleInitialData(system);
        this.setData(SymbolUtils.processInitialData(processedData));
      },
      onError: () => {
        this.setData({ isLoading: false });
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    });
  },

  onSearch(e) {
    const searchText = e.detail.value;
    
    // 设置加载状态
    this.setData({
      isLoading: true,
      showSymbols: []  // 清空当前显示的符号
    });

    // 使用 nextTick 确保加载状态已更新
    wx.nextTick(() => {
      // 获取拼音映射数据
      const pinyinData = wx.getStorageSync('pinyin_map');
      
      const filtered = SymbolUtils.searchSymbols(
        this.data.allSymbols,
        searchText,
        '全部',
        pinyinData?.pinyinMap  // 传入拼音映射数据
      );
      
      const categoryUpdate = SymbolUtils.updateCategories(filtered, searchText);
      
      // 更新搜索结果和状态
      this.setData({
        searchText,
        currentCategory: '全部',
        scrollTop: 0,
        showSymbols: filtered,
        isLoading: false,
        ...categoryUpdate
      });

      // 滚动到顶部
      wx.createSelectorQuery()
        .select('.category-scroll')
        .node()
        .exec((res) => {
          res[0]?.node?.scrollTo({ left: 0 });
        });
    });
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    const updateData = SymbolUtils.handleCategorySwitch(
      this.data.allSymbols,
      category,
      this.data.searchText,
      this.data.currentCategory
    );
    if (updateData) {
      // 获取拼音映射数据
      const pinyinData = wx.getStorageSync('pinyin_map');
      
      // 立即更新分类和显示加载状态
      this.setData({
        currentCategory: updateData.currentCategory,
        scrollTop: 0,
        isLoading: true
      });
      // 使用 nextTick 延迟更新符号列表
      wx.nextTick(() => {
        const filtered = SymbolUtils.searchSymbols(
          this.data.allSymbols,
          this.data.searchText,
          category,
          pinyinData?.pinyinMap  // 传入拼音映射数据
        );
        
        this.setData({
          showSymbols: filtered,
          isLoading: false
        });
      });
    }
  },

  // 显示符号详情
  showSymbolDetail(e) {
    const symbol = e.currentTarget.dataset.symbol;
    this.setData({
      showDetail: true,
      currentSymbol: symbol
    });
    wx.setNavigationBarTitle({
      title: symbol.name
    });
  },

  // 隐藏符号详情
  hideSymbolDetail() {
    this.setData({
      showDetail: false,
      currentSymbol: null
    });
    wx.setNavigationBarTitle({
      title: '复制符'
    });
  },

  // 分享相关方法
  onShareAppMessage() {
    if (this.data.showDetail && this.data.currentSymbol) {
      return {
        title: `${this.data.currentSymbol.symbol} - ${this.data.currentSymbol.name}`,
        path: `/pages/index/index?symbol=${encodeURIComponent(this.data.currentSymbol.symbol)}`
      }
    }
    return {
      title: '复制符 - 特殊符号检索工具',
      path: '/pages/index/index'
    }
  },

  onShareTimeline() {
    if (this.data.showDetail && this.data.currentSymbol) {
      return {
        title: `${this.data.currentSymbol.symbol} - ${this.data.currentSymbol.name}`,
        query: `symbol=${encodeURIComponent(this.data.currentSymbol.symbol)}`
      }
    }
    return {
      title: '复制符 - 特殊符号检索工具'
    }
  },

  // 滚动处理
  onCategoryScroll(e) {
    if (this.data.scrollTimer) {
      clearTimeout(this.data.scrollTimer);
    }
    this.setData({ isScrolling: true });
    const timer = setTimeout(() => {
      this.setData({ isScrolling: false });
    }, 150);
    this.setData({ scrollTimer: timer });
  }
});
