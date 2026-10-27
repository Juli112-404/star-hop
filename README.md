# 星际跃迁 · Star Hop

只包含星球游戏：九个机制样板关和原版星球无尽模式。不包含《转个弯！》。当前尚未制作 50 关。

## 下载后怎么玩

[下载完整离线包（ZIP）](https://github.com/Juli112-404/star-hop/archive/refs/heads/main.zip) · [查看单文件 HTML](https://github.com/Juli112-404/star-hop/blob/main/index.html)

下载 ZIP 后解压，打开 star-hop-main 文件夹中的 index.html。单个 HTML 可在文件页面点击 Download raw file 下载。

下载 `index.html`，用支持 JavaScript 的浏览器打开即可。所有样式和游戏代码已经内置，不需要 ChatGPT、登录、VPN、服务器或安装依赖。也可以下载整个仓库 ZIP，解压后打开 `index.html`。

手机需要通过真正的浏览器打开 HTML；微信、QQ、“文件”应用等的预览窗口可能不执行脚本。实体手机兼容性尚未完成测试。GitHub 下载是否顺畅取决于当地网络，下载后的游戏不需要联网。

点击画面或按空格发射；PERFECT 和连续精准提供额外奖励。可以暂停、重开和自由选关。最高分与星级保存在浏览器本地，隐私模式或文件网址的存储可能受限。

## 修改与重建

`src/` 保留可编辑源码；关卡数据在 `src/levels-data.js`，物理规则在 `src/levels-engine.js`，画面与操作在 `src/levels.js`。

开发时运行 `node build.cjs` 重建单文件 `index.html`。玩家无需 Node.js。仓库：https://github.com/Juli112-404/star-hop 。

此目录是独立发布版；此前的双游戏原型作为历史文件保留。

