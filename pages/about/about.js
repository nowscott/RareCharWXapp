const app = getApp();
const CacheManager = require('../../utils/cache.js');
const UpdateManager = require('../../utils/update.js');
const StatsManager = require('../../utils/stats.js');

Page({
  data: {
    texts: {
      intro: {
        title: "介绍",
        content: "👏复制符是一个帮助快速查找和使用特殊符号的小程序。收集了大量特殊符号，包括数学符号、货币符号等，并提供简单的检索功能。\n⚠️注：部分内容是 ai 生成，勘误请联系下方邮箱。"
      },
      guide: {
        title: "说明",
        steps: [
          "🔍 在首页搜索框输入关键词\\检索词（支持部分拼音检索）",
          "👆 点击符号查看详情页",
          "📋 点击右上角复制按钮即可复制符号",
          "🔄 点击更新数据按钮可更新符号库（每小时可更新一次）",
          "💡 如果遇到什么问题可以点击下方邮箱联系反馈"
        ]
      },
      footer: {
        icp: "辽ICP备xxxxxxxx号",
        copyright: "© 2025 - NowScott"
      }
    },

    // 系统配置
    DEFAULT_VERSION: '0.0.1',
    statusBarHeight: app.globalData.statusBarHeight,
    titleHeight: app.globalData.titleHeight,

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
    }
  },

  onLoad() {
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
      onSuccess: () => {
        this.fetchStatsData();
        const now = Date.now();
        this.setData({
          'stats.updateTime': UpdateManager.formatTime(now)
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