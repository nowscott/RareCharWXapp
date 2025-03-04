const app = getApp();
const StorageManager = require('../../utils/storage.js');
const UpdateManager = require('../../utils/update.js');
const SymbolUtils = require('../../utils/utils.js');

Page({
  data: {
    texts: {
      intro: {
        title: "介绍",
        content: "👏复制符是一款便捷的小程序，专为快速查找特殊符号而设计。汇集了多种类型的特殊符号，提供强大的检索功能，并支持持续更新，以满足多样化需求。\n⚠️注：部分内容是AI生成，勘误请联系下方邮箱。"
      },
      guide: {
        title: "说明",
        steps: [
          "🔍 在首页搜索框输入检索词，支持拼音检索",
          "👆 点击下方列表中的符号按钮查看详情页",
          "📋 点击右上角复制按钮即可复制符号",
          "💡 遇到问题可以点击下方邮箱反馈"
        ]
      },
      footer: {
        icp: "辽ICP备2024046252号-2X",
        copyright: "© 2025 - NowScott"
      },
      version: ''
    },

    // 系统配置
    DEFAULT_VERSION: '0.0.1',
    statusBarHeight: app.globalData.statusBarHeight,
    titleHeight: app.globalData.titleHeight,
    titleSize: app.globalData.titleSize,
    miniProgramInfo: app.globalData.miniProgramInfo,
    // 数据状态
    stats: {
      total: 0,
      topCategories: [],
      updateTime: '',
      isUpdating: false,
      versions: {
        symbols: '',
        pinyin: ''
      },
      hasUpdate: false,
      canUpdate: true
    },
    // 联系方式配置
    contact: {
      title: "联系",
      items: [
        {
          type: "xiaohongshu",
          icon: "/images/about/xiaohongshu.jpg",
          text: "小红书",
          value: "https://www.xiaohongshu.com/user/profile/5d40f52f000000001101ba6c?xsec_token=YBExHFaolW_sm5IScluGnf72j-XQD3hfCSKhMocuhOn98=&xsec_source=app_share&xhsshare=CopyLink&appuid=5d40f52f000000001101ba6c&apptime=1735997371&share_id=1f94e4523a784a3e8a232897f175f082"
        },
        {
          type: "github",
          icon: "/images/about/github.jpg",
          text: "GitHub",
          value: "https://github.com/nowscott"
        },
        {
          type: "email",
          icon: "/images/about/mail.jpg",
          text: "邮箱",
          value: "nowscott@qq.com"
        }
      ]
    },
    app: getApp(),
    fontLoaded: false
  },

  onLoad() {
    this.initVersionInfo();
    this.initUpdateInfo();
    this.fetchStatsData();
    this.checkUpdate();
  },

  // 初始化版本信息
  initVersionInfo() {
    const versionMap = {
      develop: '开发版',
      trial: '体验版',
      release: this.data.miniProgramInfo.version ? `v${this.data.miniProgramInfo.version}` : '正式版'
    };
    this.setData({
      'texts.version': `当前版本：${versionMap[this.data.miniProgramInfo.envVersion] || 'v0.0.1'} `
    });
  },

  // 初始化更新信息
  initUpdateInfo() {
    const timestamp = wx.getStorageSync('symbols_timestamp');
    const versions = StorageManager.getCurrentVersion() || {};
    
    if (timestamp) {
      this.setData({
        'stats.updateTime': UpdateManager.formatTime(timestamp),
        'stats.versions': {
          symbols: versions.symbols || this.data.DEFAULT_VERSION,
          pinyin: versions.pinyin || this.data.DEFAULT_VERSION
        }
      });
    }
    this.fetchStatsData();
  },

  async fetchStatsData() {
    try {
      const stats = await SymbolUtils.fetchStats();
      this.setData({
        'stats.total': stats.total,
        'stats.topCategories': stats.topCategories
      });
    } catch (err) {
      wx.showToast({
        title: '统计数据加载失败',
        icon: 'none'
      });
    }
  },

  copyContact(e) {
    const type = e.currentTarget.dataset.type;
    const contact = this.data.contact.items.find(item => item.type === type);
    wx.setClipboardData({
      data: contact.value,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '复制符 - 探索特殊符号的宝库',
      path: '/pages/index/index',
      imageUrl: '/images/share.png'
    }
  },

  onShareTimeline() {
    return {
      title: '复制符 - 特殊符号检索工具',
      query: '',
      imageUrl: '/images/share.png'
    }
  },

  async checkUpdate() {
    if (!app.globalData?.dataUrl) {
      console.error('数据 URL 未初始化');
      return;
    }
    
    UpdateManager.checkUpdate({
      onNewVersion: (versions) => {
        this.setData({ 
          'stats.hasUpdate': true,
          'stats.versions': versions
        });
      }
    }, app.globalData.dataUrl);
  },
}); 