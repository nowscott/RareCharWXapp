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
   * 搜索符号
   * @param {Array} symbols 符号数组
   * @param {string} searchText 搜索文本
   * @param {string} currentCategory 分类
   * @returns {Array} 过滤后的符号数组
   */
  searchSymbols(symbols, searchText, currentCategory) {
    // 处理搜索文本
    const normalizedSearch = searchText?.trim().toLowerCase() || '';
    
    let result = symbols.filter(symbol => {
      // 搜索匹配：符号本身、描述、检索词、分类都要匹配
      const matchesSearch = !normalizedSearch || 
        symbol.symbol.toLowerCase().includes(normalizedSearch) ||
        symbol.name.toLowerCase().includes(normalizedSearch) ||
        symbol.category.some(cat => cat.toLowerCase().includes(normalizedSearch)) ||
        (symbol.searchTerms || [])
          .map(term => term.toLowerCase())
          .some(term => term.includes(normalizedSearch));

      // 分类匹配
      const matchesCategory = currentCategory === '全部' || 
        symbol.category.includes(currentCategory);

      return matchesSearch && matchesCategory;
    });

    // 如果是在搜索或者特定分类下，按照匹配度排序
    if (normalizedSearch || currentCategory !== '全部') {
      result.sort((a, b) => {
        // 计算匹配度分数
        const aScore = getMatchScore(a, normalizedSearch);
        const bScore = getMatchScore(b, normalizedSearch);
        
        if (aScore !== bScore) {
          return bScore - aScore;
        }
        
        // 匹配度相同时，按 Unicode 码点排序
        const aNormalized = a.symbol.normalize('NFD');
        const bNormalized = b.symbol.normalize('NFD');
        return aNormalized.localeCompare(bNormalized);
      });
    } else {
      result = this.shuffle(result);
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

  /**
   * 统计符号数量
   * @param {Array} symbols 符号数组
   * @returns {Object} 统计结果，包含总数和前三分类的数量
   */
  countSymbols(symbols) {
    // 按分类统计
    const categoryCount = {};
    symbols.forEach(symbol => {
      symbol.category.forEach(category => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    });

    // 转换为数组并排序
    const sortedCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // 构建返回结果
    const result = {
      total: symbols.length,
      topCategories: sortedCategories.map(([category, count]) => ({
        category,
        count
      }))
    };

    return result;
  },

  /**
   * 获取分类权重
   * @param {string} category 分类
   * @returns {number} 权重
   */
  getCategoryWeight(category) {
    const weights = {
      '角分': 1,
      '角秒': 2,
      '度数': 3,
      '摄氏度': 4,
      '华氏度': 5,
      '姆欧': 6,
      '箭头': 7,
      '双向箭头': 8,
      '可逆反应箭头': 9,
      '偏导数': 10,
      // 可以继续添加其他分类的权重
    };
    return weights[category] || 999; // 未定义权重的分类放到最后
  },

  /**
   * 更新分类列表
   * @param {Array} symbols 符号数组
   * @param {string} searchText 搜索文本
   * @param {Array} categories 分类列表
   * @returns {Object} 更新后的分类列表和当前分类
   */
  updateCategories(symbols, searchText, categories) {
    // 获取搜索结果中包含的所有分类
    let filteredCategories = ['全部'];
    if (symbols.length > 0) {
      // 统计搜索结果中的分类数量
      const categoryCount = {};
      symbols.forEach(symbol => {
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
      filteredCategories = categories;
    }

    return {
      showCategories: filteredCategories,
    };
  },

  /**
   * 过滤并排序符号
   * @param {Array} allSymbols 所有符号数组
   * @param {string} searchText 搜索文本
   * @param {string} currentCategory 当前分类
   * @returns {Array} 过滤后的符号数组
   */
  filterAndSortSymbols(allSymbols, searchText, currentCategory) {
    let filtered = allSymbols;
    const normalizedSearch = searchText.toLowerCase();

    // 先对所有数据进行一次随机排序，避免保留上一次的顺序
    filtered = this.shuffle([...filtered]);

    // 如果有搜索文本，按照匹配度排序
    if (normalizedSearch) {
      filtered = filtered.filter(symbol => {
        // 1. 符号本身匹配
        const symbolMatch = symbol.symbol.toLowerCase().includes(normalizedSearch);
        
        // 2. 范畴（分类）匹配
        const categoryMatch = symbol.category.some(cat => 
          cat.toLowerCase().includes(normalizedSearch)
        );
        
        // 3. 搜索词匹配
        const searchTermsMatch = symbol.searchTerms?.some(term => 
          term.toLowerCase().includes(normalizedSearch)
        );

        return symbolMatch || categoryMatch || searchTermsMatch;
      });
    }

    // 分类过滤（如果选择了特定分类）
    if (currentCategory !== '全部') {
      filtered = filtered.filter(symbol => 
        symbol.category.includes(currentCategory)
      );
      // 在特定分类下，按匹配度排序
      if (normalizedSearch) {
        filtered.sort((a, b) => {
          const aScore = this.getMatchScore(a, normalizedSearch);
          const bScore = this.getMatchScore(b, normalizedSearch);
          return bScore - aScore;
        });
      }
    } else {
      // 在"全部"分类下，总是随机排序
      filtered = this.shuffle([...filtered]);
    }

    return filtered;
  },

  // 计算匹配度分数
  getMatchScore(symbol, searchText) {
    let score = 0;
    const normalizedSearch = searchText.toLowerCase();

    // 1. 符号本身匹配（最高优先级）
    if (symbol.symbol.toLowerCase() === normalizedSearch) {
      score += 100;  // 完全匹配
    } else if (symbol.symbol.toLowerCase().includes(normalizedSearch)) {
      score += 80;   // 部分匹配
    }

    // 2. 范畴（分类）匹配
    if (symbol.category.some(cat => cat.toLowerCase() === normalizedSearch)) {
      score += 50;   // 完全匹配
    } else if (symbol.category.some(cat => cat.toLowerCase().includes(normalizedSearch))) {
      score += 30;   // 部分匹配
    }

    // 3. 搜索词匹配
    if (symbol.searchTerms?.some(term => term.toLowerCase() === normalizedSearch)) {
      score += 60;   // 完全匹配
    } else if (symbol.searchTerms?.some(term => term.toLowerCase().includes(normalizedSearch))) {
      score += 40;   // 部分匹配
    }

    return score;
  }
};

module.exports = SymbolUtils; 