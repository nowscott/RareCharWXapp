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
    scrollTimer: null,
    touchStartX: 0,
    touchStartY: 0,
    touchEndX: 0,
    touchEndY: 0
  },
  
  onLoad() {
    const system = getApp().globalData.system;
    // 尝试加载缓存数据
    const initialData = SymbolUtils.handleInitialData(system);
    if (initialData) {
      const processedData = SymbolUtils.processInitialData(initialData);
      // 处理符号数据，添加索引
      processedData.showSymbols = this.processSymbols(processedData.showSymbols);
      this.setData(processedData);
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
    
    // 立即显示加载状态
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
        pinyinData?.pinyinMap
      );
      
      const categoryUpdate = SymbolUtils.updateCategories(filtered, searchText);
      
      // 更新搜索结果和状态
      this.setData({
        searchText,
        currentCategory: '全部',
        scrollTop: 0,
        showSymbols: this.processSymbols(filtered),
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
      // 立即更新分类和显示加载状态
      this.setData({
        currentCategory: updateData.currentCategory,
        scrollTop: 0,
        isLoading: true,
        showSymbols: []  // 清空当前显示的符号
      });
      // 使用 nextTick 确保加载状态已更新
      wx.nextTick(() => {
        // 获取拼音映射数据
        const pinyinData = wx.getStorageSync('pinyin_map');
        // 使用原有的搜索逻辑
        const filtered = SymbolUtils.searchSymbols(
          this.data.allSymbols,
          this.data.searchText,
          category,
          pinyinData?.pinyinMap
        );
        this.setData({
          showSymbols: this.processSymbols(filtered),  // 保持动画效果
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
  },

  // 添加长按复制方法
  handleLongPress(e) {
    const symbol = e.currentTarget.dataset.symbol;
    wx.setClipboardData({
      data: symbol.symbol,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success',
          duration: 500
        });
      }
    });
  },

  // 在处理符号数据时添加索引
  processSymbols(symbols) {
    return symbols.map((symbol, index) => ({
      ...symbol,
      _key: symbol.symbol + index,  // 保持原有的 key
      style: `--index: ${index}`    // 添加 index 样式变量
    }));
  },

  touchStart(e) {
    this.setData({
      touchStartX: e.touches[0].clientX,
      touchStartY: e.touches[0].clientY
    });
  },

  touchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const moveX = touchEndX - this.data.touchStartX;
    const moveY = touchEndY - this.data.touchStartY;
    // 如果垂直移动距离大于水平移动距离的一半，则认为是在上下滑动
    if (Math.abs(moveY) > Math.abs(moveX) / 2) {
      return;
    }
    // 判断是否为有效的滑动距离(大于80像素)
    if (Math.abs(moveX) > 50) {
      const currentIndex = this.data.showCategories.indexOf(this.data.currentCategory);
      let targetIndex;
      if (moveX > 0 && currentIndex > 0) {
        // 向右滑动，切换到前一个分类
        targetIndex = currentIndex - 1;
      } else if (moveX < 0 && currentIndex < this.data.showCategories.length - 1) {
        // 向左滑动，切换到后一个分类
        targetIndex = currentIndex + 1;
      }
      if (targetIndex !== undefined) {
        const category = this.data.showCategories[targetIndex];
        this.switchCategory({
          currentTarget: {
            dataset: { category }
          }
        });
      }
    }
  }
});
