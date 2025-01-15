const StorageManager = require('./storage.js');

const UpdateManager = {
  formatTime(timestamp) {  // 格式化时间
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  updateData(callbacks = {}, dataUrl) {  // 更新数据
    const {onStart, onSuccess, onFail, onComplete} = callbacks;
    this.checkUpdate({
      onNewVersion: async () => {
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