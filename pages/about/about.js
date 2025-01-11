const app = getApp();
const CacheManager = require('../../utils/cache.js');
const UpdateManager = require('../../utils/update.js');
const StatsManager = require('../../utils/stats.js');

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
          "🔄 点击更新数据按钮可更新符号库（每小时一次）",
          "🔍 在首页搜索框输入检索词（支持拼音检索）",
          "👆 点击下方列表中的符号按钮查看详情页",
          "📋 点击右上角复制按钮即可复制符号",
          "💡 遇到问题可以点击下方邮箱反馈"
        ]
      },
      footer: {
        icp: "辽ICP备xxxxxxxx号",
        copyright: "© 2025 - NowScott"
      },
      version: ''
    },

    // 系统配置
    DEFAULT_VERSION: '0.0.1',
    statusBarHeight: app.globalData.statusBarHeight,
    titleHeight: app.globalData.titleHeight,
    titleSize: app.globalData.titleSize,

    // 数据状态
    stats: {
      total: 0,
      topCategories: [],
      updateTime: '',
      isUpdating: false,
      version: '',
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
    try {
      const accountInfo = wx.getAccountInfoSync();
      let versionText = '';
      // 根据环境显示不同的版本号格式
      switch (accountInfo.miniProgram.envVersion) {
        case 'develop':
          versionText = '当前版本：开发版';
          break;
        case 'trial':
          versionText = '当前版本：体验版';
          break;
        case 'release':
          versionText = `当前版本：v${accountInfo.miniProgram.version || '0.0.1'}`;
          break;
        default:
          versionText = '当前版本：v0.0.1';
      }
      
      this.setData({
        'texts.version': `${versionText} `
      });
    } catch (e) {
      console.error('获取版本信息失败:', e);
    }

    this.fetchStatsData();
    const timestamp = wx.getStorageSync('symbols_timestamp');
    const version = CacheManager.getCurrentVersion();
    if (timestamp) {
      this.setData({
        'stats.updateTime': UpdateManager.formatTime(timestamp),
        'stats.version': version || this.data.DEFAULT_VERSION,
        'stats.canUpdate': UpdateManager.checkCanUpdate(timestamp)
      });
    }
    this.checkUpdate();
  },

  updateData() {
    UpdateManager.updateData({
      onStart: () => {
        this.setData({ 'stats.isUpdating': true });
      },
      onSuccess: (data) => {
        this.fetchStatsData();
        const now = Date.now();
        this.setData({
          'stats.updateTime': UpdateManager.formatTime(now),
          'stats.version': data.version || this.data.DEFAULT_VERSION,
          'stats.canUpdate': false
        });
      },
      onComplete: () => {
        this.setData({ 'stats.isUpdating': false });
      }
    });
  },

  fetchStatsData() {
    StatsManager.fetchStatsData({
      onSuccess: (stats) => {
        this.setData({
          'stats.total': stats.total,
          'stats.topCategories': stats.topCategories
        });
      }
    });
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
      title: '复制符 - 关于我们',
      path: '/pages/index/index'
    }
  },
  
  onShareTimeline() {
    return {
      title: '复制符 - 特殊符号检索工具'
    }
  },

  async checkUpdate() {
    UpdateManager.checkUpdate({
      onNewVersion: (newVersion) => {
        this.setData({ 'stats.hasUpdate': true });
        wx.showModal({
          title: '发现新版本',
          content: `发现新版本(${newVersion})，是否更新？`,
          success: (res) => {
            if (res.confirm) {
              this.updateData();
            }
          }
        });
      }
    });
  },
}); 