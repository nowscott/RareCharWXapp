// index.js
const app = getApp();
const SymbolUtils = require('../../utils/utils.js');
const CacheManager = require('../../utils/cache.js');

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
    app: getApp()
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
    const cachedData = CacheManager.getData();
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
          CacheManager.saveData(res.data);
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

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    
    // 使用新的 searchSymbols 方法
    const filtered = SymbolUtils.searchSymbols(
      this.data.allSymbols,
      this.data.searchText,
      category
    ).map(symbol => ({
      ...symbol,
      _key: Math.random().toString(36).slice(2)  // 添加随机key
    }));

    this.setData({
      currentCategory: category,
      scrollTop: 0,
      showSymbols: filtered,
    });
  },

  // 过滤符号
  filterSymbols(keepCategory = false) {
    // 使用新的 searchSymbols 方法
    const filtered = SymbolUtils.searchSymbols(
      this.data.allSymbols,
      this.data.searchText,
      this.data.currentCategory
    );

    // 更新显示的符号列表
    this.setData({
      showSymbols: filtered
    });

    // 如果不保持分类，更新分类列表
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
    // 设置导航栏标题为符号描述
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
    // 恢复默认标题
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
  }
});
