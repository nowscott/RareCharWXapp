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
    app: getApp(),
    isScrolling: false,
    scrollTimer: null
  },

  onLoad() {
    // 从API获取数据
    this.fetchSymbolsData();
    // 监听数据更新事件
    this.onDataUpdate = () => {
      this.fetchSymbolsData();
    };
    getApp().globalData.eventBus.on('dataUpdated', this.onDataUpdate);
  },

  onUnload() {
    // 页面销毁时取消事件监听
    if (this.onDataUpdate) {
      getApp().globalData.eventBus.off('dataUpdated', this.onDataUpdate);
    }
  },

  // 新增获取数据的方法
  fetchSymbolsData() {
    // 先尝试从缓存获取数据
    const cachedData = StorageManager.getData();
    if (cachedData) {
      this.processData(cachedData);
      // 如果有搜索文本或者非全部分类，重新应用过滤
      if (this.data.searchText || this.data.currentCategory !== '全部') {
        this.filterSymbols(true);
      }
      return;
    }

    wx.request({
      url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
      success: (res) => {
        if(res.data && res.data.symbols) {
          // 保存到缓存
          StorageManager.saveData(res.data);
          // 处理数据
          this.processData(res.data);
          // 如果有搜索文本或者非全部分类，重新应用过滤
          if (this.data.searchText || this.data.currentCategory !== '全部') {
            this.filterSymbols(true);
          }
        }
      },
      fail: (err) => {
        console.error('获取数据失败:', err);
        this.setData({
          isLoading: false
        });
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    });
  },

  // 处理数据的方法
  processData(data) {
    const symbols = data.symbols;
    // 使用新的 getCategoryStats 获取分类统计
    const categoryStats = SymbolUtils.getCategoryStats(symbols);
    const categories = ['全部', ...categoryStats.map(stat => stat.category)];
    // 始终对原始数据进行随机排序
    const shuffledSymbols = SymbolUtils.shuffle([...symbols]);
    this.setData({
      allSymbols: symbols,
      showSymbols: shuffledSymbols,
      categories: categories,
      showCategories: categories,
      isLoading: false
    });
  },

  // 添加防抖定时器
  searchTimer: null,

  // 搜索处理
  onSearch(e) {
    const searchText = e.detail.value;
    // 使用新的 searchSymbols 方法
    const filtered = SymbolUtils.searchSymbols(
      this.data.allSymbols,
      searchText,
      '全部'  // 搜索时总是从"全部"分类开始
    );
    // 使用新的 updateCategories 方法
    const categoryUpdate = SymbolUtils.updateCategories(
      filtered,
      searchText
    );
    this.setData({
      searchText,
      currentCategory: '全部',
      scrollTop: 0,
      showSymbols: filtered,
      ...categoryUpdate
    });
    // 滚动到顶部
    const query = wx.createSelectorQuery();
    query.select('.category-scroll').node().exec((res) => {
      const scrollView = res[0].node;
      scrollView?.scrollTo({
        left: 0,
      });
    });
  },

  // 添加触摸相关变量
  touchStartTime: 0,
  touchStartX: 0,
  isSwiping: false,

  // 添加触摸开始事件
  handleTouchStart(e) {
    this.touchStartTime = Date.now();
    this.touchStartX = e.touches[0].pageX;
    this.isSwiping = false;
  },

  // 添加触摸移动事件
  handleTouchMove(e) {
    const deltaX = Math.abs(e.touches[0].pageX - this.touchStartX);
    if (deltaX > 10) {  // 如果移动距离超过10px，认为是在滑动
      this.isSwiping = true;
    }
  },

  // 添加触摸结束事件
  handleTouchEnd() {
    // 重置滑动状态
    this.isSwiping = false;
  },

  // 添加滚动开始处理
  onSymbolsScrollStart() {
    this.setData({ isScrolling: true });
  },

  // 添加滚动结束处理
  onSymbolsScrollEnd() {
    this.setData({ isScrolling: false });
  },

  // 修改切换分类的处理函数
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
        isLoading: true  // 显示加载状态
      });

      // 使用 nextTick 延迟更新符号列表
      wx.nextTick(() => {
        this.setData({
          showSymbols: updateData._pendingSymbols,
          isLoading: false  // 加载完成
        });
      });
    }
  },

  // 过滤符号
  filterSymbols(keepCategory = false) {
    const filtered = SymbolUtils.searchSymbols(
      this.data.allSymbols,
      this.data.searchText,
      this.data.currentCategory
    );
    this.setData({
      showSymbols: filtered
    });
    if (!keepCategory) {
      const categoryUpdate = SymbolUtils.updateCategories(
        filtered, 
        this.data.searchText
      );
      this.setData(categoryUpdate);
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

  // 设置分享给朋友
  onShareAppMessage() {
    // 如果当前有打开的符号详情，就分享该符号
    if (this.data.showDetail && this.data.currentSymbol) {
      return {
        title: `${this.data.currentSymbol.symbol} - ${this.data.currentSymbol.name}`,
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
        title: `${this.data.currentSymbol.symbol} - ${this.data.currentSymbol.name}`,
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
  },

  // 处理分类滚动
  onCategoryScroll(e) {
    // 清除之前的定时器
    if (this.data.scrollTimer) {
      clearTimeout(this.data.scrollTimer);
    }

    // 设置滚动状态
    this.setData({ isScrolling: true });

    // 设置新的定时器，滚动停止后重置状态
    const timer = setTimeout(() => {
      this.setData({ isScrolling: false });
    }, 150);  // 150ms 后认为滚动已停止

    this.setData({ scrollTimer: timer });
  }
});
