const StorageManager = require('./storage.js');
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1小时更新间隔

const UpdateManager = {
  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },
  // 检查是否可以更新
  checkCanUpdate(lastUpdateTime) {
    const now = Date.now();
    return !lastUpdateTime || (now - lastUpdateTime) >= UPDATE_INTERVAL;
  },
  // 获取下次可更新时间
  getNextUpdateTime(lastUpdateTime) {
    return new Date(lastUpdateTime + UPDATE_INTERVAL);
  },
  // 更新数据
  updateData(callbacks = {}, hasUpdate = false, dataUrl) {
    const {onStart, onSuccess, onFail, onComplete} = callbacks;
    
    // 先检查是否有新版本
    this.checkUpdate({
      onNewVersion: async (serverVersion) => {
        // 只有在有新版本时才执行更新
        onStart?.();
        StorageManager.clearCache();
        
        try {
          // 并行请求数据和拼音映射
          const [symbolsRes, pinyinRes] = await Promise.all([
            this._request(dataUrl || getApp().globalData.dataUrl),
            this._request('https://symboldata.oss-cn-shanghai.aliyuncs.com/pinyin-map.json')
          ]);

          if (symbolsRes.data?.symbols && pinyinRes.data?.pinyinMap) {
            // 保存符号数据和拼音映射
            StorageManager.saveData(symbolsRes.data, pinyinRes.data);
            
            onSuccess?.(symbolsRes.data);
            getApp().globalData.eventBus.emit('dataUpdated');
            
            wx.showToast({
              title: '数据已更新',
              icon: 'success'
            });
          }
        } catch (err) {
          console.error('更新数据失败:', err);
          onFail?.(err);
          wx.showToast({
            title: '更新失败',
            icon: 'error'
          });
        } finally {
          onComplete?.();
        }
      },
      onNoUpdate: () => {
        if (hasUpdate === undefined) {
          const timestamp = wx.getStorageSync('symbols_timestamp');
          const nextUpdate = this.getNextUpdateTime(timestamp);
          wx.showToast({
            title: `${this.formatTime(nextUpdate)}后可更新`,
            icon: 'none',
            duration: 1000
          });
        }
        onComplete?.();
      }
    }, dataUrl);
  },
  // 添加请求包装方法
  _request(url) {
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: resolve,
        fail: reject
      });
    });
  },
  // 检查更新
  checkUpdate({ onNewVersion, onNoUpdate } = {}, dataUrl) {
    console.log('正在检查数据更新...');
    Promise.all([
      this._request(dataUrl || getApp().globalData.dataUrl),
      this._request('https://symboldata.oss-cn-shanghai.aliyuncs.com/pinyin-map.json')
    ]).then(([symbolsRes, pinyinRes]) => {
      if (symbolsRes.data?.version && pinyinRes.data?.version) {
        const currentVersions = StorageManager.getCurrentVersion() || {};
        const currentSymbolsVersion = currentVersions.symbols;
        const currentPinyinVersion = currentVersions.pinyin;
        
        const serverSymbolsVersion = symbolsRes.data.version;
        const serverPinyinVersion = pinyinRes.data.version;
        
        // 去掉 beta 后缀后比较版本号
        const cleanCurrentVersion = currentSymbolsVersion?.replace('-beta', '') || '';
        const cleanServerVersion = serverSymbolsVersion?.replace('-beta', '') || '';
        
        console.log('当前符号版本:', currentSymbolsVersion, '服务器符号版本:', serverSymbolsVersion);
        console.log('当前拼音版本:', currentPinyinVersion, '服务器拼音版本:', serverPinyinVersion);
        
        // 如果任一数据需要更新，则触发更新
        if (cleanCurrentVersion !== cleanServerVersion || currentPinyinVersion !== serverPinyinVersion) {
          console.log('发现新版本！');
          onNewVersion?.(serverSymbolsVersion);
        } else {
          console.log('已是最新版本');
          onNoUpdate?.();
        }
      } else {
        onNoUpdate?.();
      }
    }).catch(err => {
      console.error('检查更新失败:', err);
      onNoUpdate?.();
    });
  }
};

module.exports = UpdateManager; 