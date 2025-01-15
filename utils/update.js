const StorageManager = require('./storage.js');
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1小时更新间隔

const UpdateManager = {
  formatTime(timestamp) {  // 格式化时间
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },
  checkCanUpdate(lastUpdateTime) {  // 检查是否可以更新
    const now = Date.now();
    return !lastUpdateTime || (now - lastUpdateTime) >= UPDATE_INTERVAL;
  },
  getNextUpdateTime(lastUpdateTime) {  // 获取下次可更新时间
    return new Date(lastUpdateTime + UPDATE_INTERVAL);
  },
  updateData(callbacks = {}, hasUpdate = false, dataUrl) {  // 更新数据
    const {onStart, onSuccess, onFail, onComplete} = callbacks;
    this.checkUpdate({
      onNewVersion: async (serverVersion) => {
        onStart?.();
        StorageManager.clearCache();
        try {
          const [symbolsRes, pinyinRes] = await Promise.all([
            this._request(dataUrl || getApp().globalData.dataUrl),
            this._request('https://symboldata.oss-cn-shanghai.aliyuncs.com/pinyin-map.json')
          ]);
          if (!symbolsRes.data?.symbols || !pinyinRes.data?.pinyinMap) { // 检查数据有效性
            throw new Error('Invalid data format');
          }
          // 保存数据
          StorageManager.saveData(symbolsRes.data, pinyinRes.data);
          onSuccess?.(symbolsRes.data);
          getApp().globalData.eventBus.emit('dataUpdated');
          wx.showToast({
            title: '数据已更新',
            icon: 'success'
          });
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
  _request(url) {  // 添加请求包装方法
    return new Promise((resolve, reject) => {
      wx.request({
        url,
        success: resolve,
        fail: reject
      });
    });
  },
  checkUpdate({ onNewVersion, onNoUpdate } = {}, dataUrl) {  // 统一的检查更新方法
    console.log('正在检查数据更新...');    
    Promise.all([
      StorageManager._request(dataUrl || getApp().globalData.dataUrl),
      StorageManager._request('https://symboldata.oss-cn-shanghai.aliyuncs.com/pinyin-map.json')
    ]).then(([symbolsRes, pinyinRes]) => {
      if (symbolsRes.data?.version && pinyinRes.data?.version) {
        const currentVersions = StorageManager.getCurrentVersion() || {};
        const currentSymbolsVersion = currentVersions.symbols;
        const currentPinyinVersion = currentVersions.pinyin;
        const serverSymbolsVersion = symbolsRes.data.version;
        const serverPinyinVersion = pinyinRes.data.version;
        console.log('当前符号版本:', currentSymbolsVersion, '服务器符号版本:', serverSymbolsVersion);
        console.log('当前拼音版本:', currentPinyinVersion, '服务器拼音版本:', serverPinyinVersion);
        // 去掉 beta 后缀后比较版本号
        const cleanCurrentVersion = currentSymbolsVersion?.replace('-beta', '') || '';
        const cleanServerVersion = serverSymbolsVersion?.replace('-beta', '') || '';
        // 如果任一数据需要更新，则触发更新
        if (cleanCurrentVersion !== cleanServerVersion || currentPinyinVersion !== serverPinyinVersion) {
          console.log('发现新版本！');
          onNewVersion?.({
            symbols: serverSymbolsVersion,
            pinyin: serverPinyinVersion
          });
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