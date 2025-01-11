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
    isScrolling: false,
    statusBarHeight: app.globalData.statusBarHeight,
    titleHeight: app.globalData.titleHeight,
    isLoading: true
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
    
    // 处理分类
    const categorySet = new Set();
    symbols.forEach(symbol => {
      if(Array.isArray(symbol.category)) {
        symbol.category.forEach(cat => categorySet.add(cat));
      }
    });
    
    // 将分类转换为数组并按照使用频率排序
    const categoryArray = Array.from(categorySet);
    const categoryCount = {};
    symbols.forEach(symbol => {
      symbol.category.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });
    
    // 按使用频率排序分类
    categoryArray.sort((a, b) => categoryCount[b] - categoryCount[a]);
    
    const categories = ['全部', ...categoryArray];
    
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
