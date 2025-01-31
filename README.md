# 复制符 - 特殊符号检索小程序

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

## 项目简介
复制符是一款便捷的微信小程序，专为快速查找和复制特殊符号而设计。它汇集了多种类型的特殊符号，提供强大的检索功能，支持持续更新，以满足用户多样化的符号使用需求。

## 功能特点
- 🔍 **智能检索**：支持拼音检索，快速找到目标符号
- 📋 **便捷复制**：一键复制符号，支持符号+名称组合复制
- 🏷️ **分类浏览**：符号分类清晰，支持横向滚动切换分类
- 🌓 **暗黑模式**：支持系统级暗黑模式，提供舒适的浏览体验
- 🔄 **自动更新**：支持符号库自动更新，持续扩充符号内容

## 技术架构
- 基于微信小程序原生框架开发
- 采用组件化开发方式，提高代码复用性
- 使用自定义导航栏，优化用户体验
- 实现数据本地存储，提升访问速度
- 集成自动更新机制，确保内容时效性

## 目录结构
```
├── components/          # 组件目录
│   ├── detail/         # 符号详情组件
│   └── tabbar/         # 自定义底部导航栏组件
├── pages/              # 页面目录
│   ├── index/         # 首页（符号检索页）
│   └── about/         # 关于页面
├── utils/              # 工具类
│   ├── eventBus.js    # 事件总线
│   ├── storage.js     # 存储管理
│   ├── update.js      # 更新管理
│   └── utils.js       # 通用工具函数
├── images/             # 图片资源
├── app.js             # 应用入口文件
├── app.json           # 应用配置文件
└── project.config.json # 项目配置文件
```

## 开发环境
- 微信开发者工具
- Node.js 环境
- 小程序基础库版本：3.6.6+

## 项目配置
1. 克隆项目到本地
2. 使用微信开发者工具打开项目
3. 在project.config.json中配置自己的appid
4. 开始开发

## 联系方式
- 小红书：[作者主页](https://www.xiaohongshu.com/user/profile/5d40f52f000000001101ba6c)
- GitHub：[nowscott](https://github.com/nowscott)
- 邮箱：nowscott@qq.com

## 版权信息
© 2025 - NowScott

备案号：辽ICP备2024046252号-2X