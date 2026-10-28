# 星际跃迁 Star Hop

单击起跳的 HTML5 星球游戏，支持桌面鼠标与手机触屏。当前提供十个闯关关卡和无尽挑战，无后端、无外部资源。

## 下载试玩

点击仓库页面 Code → Download ZIP，解压后用浏览器打开根目录 index.html。也可进入 index.html 文件页，选择 Download raw file 下载单文件，离线打开即可。无需 Node.js 或电脑持续运行。

## 十关内容

1. 初次起跳
2. 两次跃迁
3. 自由选路
4. 引力绕障
5. 移动终点与交会预判
6. 90° 传送门
7. 星球逐渐变小
8. 限时起跳
9. 钥匙解锁
10. 传送与限时组合

闯关以抵达终点为目标，无星屑收集或星级评分。PERFECT 为精准操作反馈。第一关显示点击引导，其余通过图形展示；无键盘快捷键。无尽模式保留计分、连击和本地最高纪录。

## 开发与验证

使用 Node.js 重建：`node build.cjs`。

运行验证：

```
node tests/review.cjs
node tests/mobile-size.cjs
node tests/minimal-ui.cjs
```

可选本机服务：`node server.cjs`，访问 http://127.0.0.1:8092 。

`src/review-data.js` 定义关卡，`src/levels-engine.js` 实现可独立测试的模拟，`src/review.js` 处理绘制和交互。新增关卡可继续扩展数据；目前仅为十关版本，尚未完成比赛所需五十关。

本地记录存储于浏览器，暂停菜单可导出试玩记录；不向服务器发送。已完成十关路线、手机尺寸及界面自动检查，实体手机兼容性仍需实际试玩确认。
