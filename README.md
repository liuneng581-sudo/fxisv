# OpenClaw Platform

开源 AI Agent 开发者平台

## 项目结构

```
openclaw/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 首页
│   │   ├── layout.tsx         # 根布局
│   │   ├── globals.css        # 全局样式
│   │   ├── openclaw/          # OpenClaw 专区
│   │   ├── hermes/            # Hermes 专区
│   │   ├── skills/            # Skills 专区
│   │   ├── help/              # 求助专区
│   │   ├── tools/             # 工具专区
│   │   ├── login/             # 登录页
│   │   └── register/          # 注册页
│   └── components/
│       ├── Navbar.tsx         # 导航栏
│       └── Particles.tsx      # 粒子效果组件
├── public/                     # 静态资源
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **语言**: TypeScript

## 设计风格

Apple 极简风格：
- 配色: #0071e3 (蓝) / #1d1d1f (黑) / #86868b (灰)
- 字体: SF Pro Display
- 导航: 44px 黑色毛玻璃
- 布局: 大量留白，圆角卡片

## 开发

```bash
npm install
npm run dev     # 开发模式
npm run build   # 生产构建
npm start       # 生产运行
```

## 页面

| 路径 | 描述 |
|------|------|
| / | 首页 |
| /openclaw | OpenClaw 框架介绍 |
| /hermes | Hermes AI 助手 |
| /skills | 技能库 |
| /help | 求助/FAQ |
| /tools | 开发工具 |
| /login | 登录 |
| /register | 注册 |

## 部署

服务器: ubuntu@101.42.27.33:/home/ubuntu/openclaw

```bash
# 构建
npm run build

# 同步到服务器
rsync -avz ./ ubuntu@101.42.27.33:/home/ubuntu/openclaw/

# 服务器重启
cd /home/ubuntu/openclaw && npm start
```
