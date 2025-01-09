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
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
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
   * @param {string} category 分类
   * @returns {Array} 过滤后的符号数组
   */
  searchSymbols(symbols, searchText, category) {
    let result = [...symbols];
    
    // 按分类过滤
    if (category && category !== '全部') {
      result = result.filter(item => item.category === category);
      // 按 Unicode 码点排序，考虑组合字符
      result.sort((a, b) => {
        // 使用 NFD 将字符分解为基本字符和组合字符
        const aNormalized = a.symbol.normalize('NFD');
        const bNormalized = b.symbol.normalize('NFD');
        
        // 如果分解后的字符串不同，按分解后的字符串比较
        if (aNormalized !== bNormalized) {
          return aNormalized.localeCompare(bNormalized);
        }
        
        // 如果分解后的字符串相同，按原始字符串的码点值比较
        const aCode = Array.from(a.symbol).map(c => c.codePointAt(0));
        const bCode = Array.from(b.symbol).map(c => c.codePointAt(0));
        
        // 比较每个码点
        for (let i = 0; i < Math.min(aCode.length, bCode.length); i++) {
          if (aCode[i] !== bCode[i]) {
            return aCode[i] - bCode[i];
          }
        }
        
        // 如果前面的码点都相同，长度更短的排在前面
        return aCode.length - bCode.length;
      });
    } else {
      // 全部分类下随机排序
      if (!searchText) {
        result = this.shuffle(result);
      }
    }
    
    // 搜索过滤
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(item => 
        item.symbol.includes(searchText) ||
        item.searchTerms.some(term => 
          term.toLowerCase().includes(searchLower)
        ) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
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
      const category = symbol.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(symbol);
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
    const categoryCount = symbols.reduce((counts, symbol) => {
      const category = symbol.category;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});

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
    const categoryCount = symbols.reduce((counts, symbol) => {
      const category = symbol.category;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});

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
  }
};

module.exports = SymbolUtils; 