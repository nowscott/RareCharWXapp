/**
 * 符号工具类
 */
const SymbolUtils = {
  /**
   * 随机打乱数组
   * @param {Array} array 要打乱的数组
   * @returns {Array} 打乱后的新数组
   */
  shuffle(array) {
    const newArray = [...array];  // 创建新数组，避免修改原数组
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  },

  /**
   * 从数组中随机获取指定数量的元素
   * @param {Array} array 源数组
   * @param {number} count 需要的数量
   * @returns {Array} 随机结果数组
   */
  getRandomItems(array, count) {
    return this.shuffle(array).slice(0, count);
  },

  /**
   * 数据去重
   * @param {Array} symbols 符号数组
   * @returns {Array} 去重后的符号数组
   */
  removeDuplicates(symbols) {
    const seen = new Map();
    
    return symbols.filter(symbol => {
      const key = symbol.symbol;
      if (seen.has(key)) {
        console.warn(`发现重复符号: ${key}`);
        return false;
      } else {
        seen.set(key, true);
        return true;
      }
    });
  },

  /**
   * 计算符号与搜索文本的匹配度分数
   * @private
   */
  _getMatchScore(symbol, searchText) {
    let score = 0;
    const normalizedSearch = searchText.toLowerCase();

    // 符号本身匹配（最高优先级）
    if (symbol.symbol.toLowerCase() === normalizedSearch) {
      score += 100;  // 完全匹配
    } else if (symbol.symbol.toLowerCase().includes(normalizedSearch)) {
      score += 80;   // 部分匹配
    }

    // 范畴（分类）匹配
    if (symbol.category.some(cat => cat.toLowerCase() === normalizedSearch)) {
      score += 50;   // 完全匹配
    } else if (symbol.category.some(cat => cat.toLowerCase().includes(normalizedSearch))) {
      score += 30;   // 部分匹配
    }

    // 搜索词匹配
    if (symbol.searchTerms?.some(term => term.toLowerCase() === normalizedSearch)) {
      score += 60;   // 完全匹配
    } else if (symbol.searchTerms?.some(term => term.toLowerCase().includes(normalizedSearch))) {
      score += 40;   // 部分匹配
    }

    return score;
  },

  /**
   * 搜索符号（合并了原 searchSymbols 和 filterAndSortSymbols 的功能）
   */
  searchSymbols(symbols, searchText, currentCategory) {
    // 确保输入参数都是有效的
    if (!Array.isArray(symbols) || !symbols.length) {
      console.warn('Invalid symbols array:', symbols);
      return [];
    }
    const normalizedSearch = searchText?.trim().toLowerCase() || '';
    let result = [...symbols];  // 创建一个新的数组副本
    // 先进行分类过滤
    if (currentCategory && currentCategory !== '全部') {
      result = result.filter(symbol => 
        Array.isArray(symbol.category) && 
        symbol.category.includes(currentCategory)
      );
    }
    // 如果有搜索文本，进行搜索过滤和排序
    if (normalizedSearch) {
      result = result.filter(symbol => {
        const matchesSymbol = symbol.symbol.toLowerCase().includes(normalizedSearch);
        const matchesName = symbol.name.toLowerCase().includes(normalizedSearch);
        const matchesCategory = symbol.category.some(cat => 
          cat.toLowerCase().includes(normalizedSearch)
        );
        const matchesSearchTerms = (symbol.searchTerms || [])
          .some(term => term.toLowerCase().includes(normalizedSearch));
        return matchesSymbol || matchesName || matchesCategory || matchesSearchTerms;
      });

      // 搜索时按匹配度排序
      result.sort((a, b) => {
        const aScore = this._getMatchScore(a, normalizedSearch);
        const bScore = this._getMatchScore(b, normalizedSearch);
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        // 匹配度相同时，按 Unicode 码点排序，使用 NFC 格式
        return a.symbol.normalize('NFC').localeCompare(b.symbol.normalize('NFC'));
      });
    } else {
      // 无搜索文本时的排序逻辑
      if (currentCategory === '全部') {
        // 全部分类下随机排序
        result = this.shuffle(result);
      } else {
        // 其他分类下按 Unicode 码点值排序
        result.sort((a, b) => {
          const aCode = a.symbol.codePointAt(0);
          const bCode = b.symbol.codePointAt(0);
          return aCode - bCode;
        });
      }
    }
    return result;
  },

  /**
   * 按分类对符号进行分组
   * @param {Array} symbols 符号数组
   * @returns {Object} 分组结果
   */
  groupByCategory(symbols) {
    return symbols.reduce((groups, symbol) => {
      symbol.category.forEach(category => {
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(symbol);
      });
      return groups;
    }, {});
  },

  /**
   * 获取所有分类
   * @param {Array} symbols 符号数组
   * @returns {Array} 按符号数量排序的分类列表
   */
  getCategories(symbols) {
    // 统计每个分类的符号数量
    const categoryCount = {};
    symbols.forEach(symbol => {
      symbol.category.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });

    // 转换为数组并按数量降序排序
    const sortedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)  // 按数量降序排序
      .map(([category]) => category);  // 只保留分类名

    return sortedCategories;
  },

  //获取分类统计
  getCategoryStats(symbols) {
    // 统计每个分类的符号数量
    const categoryCount = {};
    symbols.forEach(symbol => {
      symbol.category.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });
    // 转换为数组并按数量降序排序
    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([category, count]) => ({
        category,
        count
      }));
  },
  //更新分类列表
  updateCategories(symbols, searchText) {
    const categoryStats = this.getCategoryStats(symbols);
    return {
      showCategories: ['全部', ...categoryStats.map(stat => stat.category)]
    };
  },
  /**
   * 获取统计数据
   * @param {Array} symbols 符号数组
   * @returns {Object} 统计结果，包含总数和前三分类的数量
   */
  getStats(symbols) {
    // 按分类统计
    const categoryCount = {};
    symbols.forEach(symbol => {
      symbol.category.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });
    // 转换为数组并排序，取前三
    const sortedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    // 返回总数和前三分类
    return {
      total: symbols.length,
      topCategories: sortedCategories.map(([category, count]) => ({
        category,
        count
      }))
    };
  },

  /**
   * 检查符号是否在禁用区间内
   * @param {string} symbol 要检查的符号
   * @param {Array} ranges 禁用区间数组
   * @returns {boolean} 是否在禁用区间内
   */
  isSymbolInDisabledRanges(symbol, ranges) {
    if (!ranges || !ranges.length) return false;
    // 获取符号的 unicode 值
    const code = symbol.codePointAt(0).toString(16).toUpperCase();
    // 检查是否在任何禁用区间内
    return ranges.some(range => {
      const [start, end] = range.split('-');
      return code >= start && code <= end;
    });
  },

  /**
   * 从远程获取统计数据
   * @returns {Promise} 统计数据的 Promise
   */
  async fetchStats() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
          success: resolve,
          fail: reject
        });
      });
      if (res.data && res.data.symbols) {
        // 获取系统类型
        const system = getApp().globalData.system;
        // 获取系统禁用区间
        const disabledRanges = (res.data.systemRanges || {})[system] || [];
        // 过滤掉系统不支持的符号
        const filteredSymbols = res.data.symbols.filter(symbol => 
          !this.isSymbolInDisabledRanges(symbol.symbol, disabledRanges)
        );
        
        return this.getStats(filteredSymbols);
      }
      throw new Error('Invalid data format');
    } catch (err) {
      console.error('获取统计数据失败:', err);
      throw err;
    }
  },

  /**
   * 处理分类切换
   * @param {Array} allSymbols 所有符号数组
   * @param {string} category 目标分类
   * @param {string} searchText 当前搜索文本
   * @param {string} currentCategory 当前分类
   * @returns {Object|null} 返回更新数据，如果分类相同则返回 null
   */
  handleCategorySwitch(allSymbols, category, searchText, currentCategory) {
    if (category === currentCategory) {
      return null;
    }
    // 立即返回分类切换
    return {
      currentCategory: category,  // 立即更新分类
      showSymbols: [],           // 先清空列表
      _pendingSymbols: this.searchSymbols(  // 后台开始筛选
        allSymbols,
        searchText,
        category
      ).map((symbol, index) => ({
        ...symbol,
        _key: Math.random().toString(36).slice(2),
        '--index': index
      }))
    };
  },

  /**
   * 处理初始数据加载
   * @param {string} system 系统类型
   * @returns {Object|null} 处理后的数据
   */
  handleInitialData(system) {
    const symbolData = wx.getStorageSync('symbols_data');
    if (symbolData && symbolData.symbols) {
      const disabledRanges = (symbolData.systemRanges || {})[system] || [];
      const filteredSymbols = symbolData.symbols.filter(symbol => 
        !this.isSymbolInDisabledRanges(symbol.symbol, disabledRanges)
      );
      return {
        ...symbolData,
        symbols: filteredSymbols
      };
    }
    return null;
  },

  /**
   * 处理数据并返回初始化状态
   * @param {Object} data 原始数据
   * @returns {Object} 处理后的状态
   */
  processInitialData(data) {
    const symbols = data.symbols;
    const categoryStats = this.getCategoryStats(symbols);
    const categories = ['全部', ...categoryStats.map(stat => stat.category)];
    const shuffledSymbols = this.shuffle([...symbols]);
    
    return {
      allSymbols: symbols,
      showSymbols: shuffledSymbols,
      categories,
      showCategories: categories,
      isLoading: false
    };
  },

  /**
   * 从服务器获取数据
   * @param {Object} options 配置项
   * @returns {Promise}
   */
  fetchData(options = {}) {
    const { onSuccess, onError } = options;
    
    wx.request({
      url: 'https://symboldata.oss-cn-shanghai.aliyuncs.com/data.json',
      success: (res) => {
        if(res.data && res.data.symbols) {
          onSuccess?.(res.data);
        }
      },
      fail: (err) => {
        console.error('获取数据失败:', err);
        onError?.(err);
      }
    });
  }
};

module.exports = SymbolUtils; 