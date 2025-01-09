const app = getApp();
const symbolsData = require('../../data/data.js');
const SymbolUtils = require('../../utils/utils.js');

Page({
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
    titleBarHeight: app.globalData.titleBarHeight,
    navHeight: app.globalData.statusBarHeightNum + app.globalData.titleBarHeightNum + 'px',
    stats: {
      total: 0,
      topCategories: []
    },
    intro: {
      title: "介绍",
      content: "复制符是一个帮助快速查找和使用特殊符号的小程序。我们收集了大量特殊符号，包括数学符号、货币符号等，并提供简单的检索功能。"
    },
    guide: {
      title: "使用说明",
      steps: [
        "在首页搜索框输入关键词",
        "点击符号查看详情",
        "点击复制即可使用",
        "如果遇到什么问题可以点击下方邮箱联系反馈"
      ]
    },
    contact: {
      title: "联系方式",
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
    footer: {
      version: "当前版本:v0.0.9",
      icp: "辽ICP备xxxxxxxx号",
      copyright: "© 2025 - NowScott"
    }
  },

  onLoad() {
    // 获取符号统计数据
    const stats = SymbolUtils.countSymbols(symbolsData.symbols);
    this.setData({ stats });
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
      title: '复制符 - 生僻符号检索工具',
      path: '/pages/index/index'
    }
  }
}); 