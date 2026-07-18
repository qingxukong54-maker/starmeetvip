# StarMeet 静态模仿站（starmeetvip）

仿照 `http://111.231.8.205`（StarMeet-跨界交友）制作的**纯静态 H5 站点**，无后台、无框架，仅用 HTML/CSS/JS。

## 页面结构
- `index.html` — 首页（轮播 banner / 快捷入口 / 今日之星 / 最新嘉宾 / 交友活动）
- `match.html` — 找缘分（用户网格 + 性别筛选）
- `activity.html` — 活动（报名中 / 已结束 筛选）
- `activity-detail.html` — 活动详情（数据驱动，见 `assets/js/main.js` 的 `ACTIVITIES`）
- `member.html` — 会员详情（资料 + 猜你喜欢 + 加入 CTA）
- `assets/css/style.css` — 共享设计系统（主色 `#ff5a6e`，渐变 `#ff5a6e→#ff8a3d`）
- `assets/js/main.js` — 交互脚本（客服弹窗、复制微信号、轮播、筛选、活动详情）

## 设计要点
- 移动端优先，居中手机列（max-width 480px）
- 全局「会员」入口 → 客服弹窗（微信二维码 + 可复制微信号）
- 微信客服号：`StarMeet_KF`（在 `main.js` 的 `CONFIG` 中修改）

## 本地预览
直接用浏览器打开 `index.html` 即可（建议手机模式 / 窄窗口）。

## 部署
将本仓库内容托管到任意静态空间（GitHub Pages / Vercel / Nginx 等）即可访问。
