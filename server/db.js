const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'openclaw.db');
const db = new Database(dbPath);

// 启用外键
db.pragma('foreign_keys = ON');

// 初始化表结构
db.exec(`
  -- 用户表

  -- AI模型表
  CREATE TABLE IF NOT EXISTS models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    url TEXT,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    image TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    points INTEGER DEFAULT 0,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 签到记录
  CREATE TABLE IF NOT EXISTS signin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    signin_date DATE NOT NULL,
    points_earned INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, signin_date)
  );

  -- 积分变动记录
  CREATE TABLE IF NOT EXISTS points_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('signin', 'post', 'reward', 'exchange', 'admin', 'deduct')),
    amount INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    description TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 技能表
  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    github_url TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    category TEXT DEFAULT 'OpenClaw',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 工具表
  CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    url TEXT DEFAULT '',
    category TEXT DEFAULT 'tools',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 教程表 (OpenClaw/Hermes)
  CREATE TABLE IF NOT EXISTS tutorials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL CHECK(category IN ('OpenClaw', 'Hermes')),
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 求助帖子
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT DEFAULT 'help' CHECK(category IN ('help', 'openclaw', 'hermes', 'skills', 'tools')),
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    images TEXT DEFAULT '[]',
    points_reward INTEGER DEFAULT 0,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'solved', 'closed')),
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 回帖表
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_best_answer INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- 积分商品表
  CREATE TABLE IF NOT EXISTS treasures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    points_price INTEGER NOT NULL,
    type TEXT DEFAULT 'capability' CHECK(type IN ('capability', 'token')),
    token_amount INTEGER DEFAULT 0,
    stock INTEGER DEFAULT -1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 兑换记录
  CREATE TABLE IF NOT EXISTS exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    treasure_id INTEGER NOT NULL,
    points_spent INTEGER NOT NULL,
    token_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (treasure_id) REFERENCES treasures(id) ON DELETE CASCADE
  );

  -- 上传图片记录
  CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// 创建默认管理员
const adminExists = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare(`
    INSERT INTO users (email, phone, password, nickname, role, points)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('admin@openclaw.com', '13800138000', hash, '管理员', 'admin', 999999);
  console.log('默认管理员创建: admin@openclaw.com / admin123');
}

// 创建默认积分商品
const treasureCount = db.prepare('SELECT COUNT(*) as count FROM treasures').get();
if (treasureCount.count === 0) {
  const defaultTreasures = [
    { name: '基础Token包', description: '100 Token额度', points_price: 100, type: 'token', token_amount: 100 },
    { name: '高级Token包', description: '500 Token额度', points_price: 450, type: 'token', token_amount: 500 },
    { name: '1小时加速卡', description: '求助帖子优先处理', points_price: 50, type: 'capability' },
    { name: '24小时加速卡', description: '求助帖子24小时优先', points_price: 200, type: 'capability' },
    { name: '专属标签', description: '获得专属用户标签', points_price: 300, type: 'capability' },
  ];
  const stmt = db.prepare(`
    INSERT INTO treasures (name, description, points_price, type, token_amount, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  defaultTreasures.forEach((t, i) => {
    stmt.run(t.name, t.description, t.points_price, t.type, t.token_amount || 0, i);
  });
}

// 创建默认技能
const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get();
if (skillCount.count === 0) {
  const defaultSkills = [
    { name: 'Claude Code', description: 'Anthropic官方CLI工具，支持AI编程', github_url: 'https://github.com/anthropics/claude-code', icon: '🤖', category: 'OpenClaw' },
    { name: 'OpenCode', description: '开源AI编程助手，支持多模型', github_url: 'https://github.com/opencode-ai/opencode', icon: '💻', category: 'OpenClaw' },
    { name: 'Hermes CLI', description: 'Hermes命令行工具', github_url: 'https://github.com/hermes-ai/cli', icon: '🤖', category: 'Hermes' },
  ];
  const stmt = db.prepare(`
    INSERT INTO skills (name, description, github_url, icon, category, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  defaultSkills.forEach((s, i) => {
    stmt.run(s.name, s.description, s.github_url, s.icon, s.category, i);
  });
}

// 创建默认工具
const toolCount = db.prepare('SELECT COUNT(*) as count FROM tools').get();
if (toolCount.count === 0) {
  const defaultTools = [
    { name: 'VS Code', description: '微软开源代码编辑器', icon: '💻', url: 'https://code.visualstudio.com/', category: 'tools' },
    { name: 'Cursor', description: 'AI优先的代码编辑器', icon: '🎯', url: 'https://cursor.sh/', category: 'tools' },
    { name: 'Docker', description: '容器化平台', icon: '🐳', url: 'https://docker.com/', category: 'tools' },
    { name: 'GitHub', description: '代码托管平台', icon: '🐙', url: 'https://github.com/', category: 'tools' },
  ];
  const stmt = db.prepare(`
    INSERT INTO tools (name, description, icon, url, category, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  defaultTools.forEach((t, i) => {
    stmt.run(t.name, t.description, t.icon, t.url, t.category, i);
  });
}

// 创建默认教程
const tutorialCount = db.prepare('SELECT COUNT(*) as count FROM tutorials').get();
if (tutorialCount.count === 0) {
  const defaultTutorials = [
    // OpenClaw 教程
    { category: 'OpenClaw', title: '快速开始：5分钟搭建你的第一个 Agent', content: '## 环境准备\n\n确保已安装 Node.js 18+ 和 npm。\n\n```bash\nnode --version  # >= 18.0.0\nnpm --version\n```\n\n## 安装 OpenClaw\n\n```bash\nnpm install -g openclaw\n```\n\n## 创建项目\n\n```bash\nopenclaw new my-agent\ncd my-agent\nnpm install\n```\n\n## 启动项目\n\n```bash\nopenclaw dev\n```\n\n访问 http://localhost:3000 即可看到你的第一个 Agent。\n\n## 配置模型\n\n在 `.env` 文件中添加你的 API Key：\n\n```\nOPENAI_API_KEY=sk-xxxxx\n```\n\n## 下一步\n\n- 学习如何定义工具（Tools）\n- 了解记忆系统（Memory）\n- 部署到生产环境', sort_order: 1 },
    { category: 'OpenClaw', title: '工具系统：让 Agent 调用外部能力', content: '## 什么是工具（Tools）\n\nTools 是 Agent 与外部世界交互的桥梁。每个 Tool 包含：\n\n- **name**: 工具名称\n- **description**: 描述（AI 会根据这个决定是否调用）\n- **parameters**: 参数 schema\n- **handler**: 执行函数\n\n## 定义一个工具\n\n```javascript\nconst calculator = {\n  name: "calculator",\n  description: "执行数学计算",\n  parameters: {\n    expression: { type: "string", description: "数学表达式" }\n  },\n  handler: async ({ expression }) => {\n    const result = eval(expression);\n    return { result };\n  }\n};\n```\n\n## 注册工具\n\n```javascript\nagent.registerTool(calculator);\n```\n\n## 内置工具\n\nOpenClaw 提供丰富的内置工具：\n- `WebSearch`: 搜索互联网\n- `FileSystem`: 读写文件\n- `CodeExecutor`: 执行代码\n- `APIRequest`: 发送 HTTP 请求', sort_order: 2 },
    { category: 'OpenClaw', title: '部署上线：从本地到生产环境', content: '## 构建生产版本\n\n```bash\nopenclaw build\n```\n\n## 环境变量\n\n生产环境必须设置：\n\n```bash\nOPENAI_API_KEY=sk-xxxxx\nJWT_SECRET=your-secret-key\nNODE_ENV=production\n```\n\n## 使用 PM2 部署\n\n```bash\nnpm install -g pm2\npm2 start dist/server.js --name openclaw\npm2 save\npm2 startup\n```\n\n## Docker 部署\n\n```dockerfile\nFROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY dist ./dist\nEXPOSE 3000\nCMD ["node", "dist/server.js"]\n```\n\n## Nginx 反向代理\n\n```nginx\nserver {\n  listen 80;\n  server_name your-domain.com;\n\n  location / {\n    proxy_pass http://localhost:3000;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection "upgrade";\n  }\n}\n```', sort_order: 3 },
    // Hermes 教程
    { category: 'Hermes', title: 'Hermes 是什么？下一代 AI Agent 框架', content: '## 核心定位\n\nHermes 是一个专注于**复杂任务自动化**的 AI Agent 框架。相比 OpenClaw，Hermes 更强调：\n\n- 多步骤推理与规划\n- 长期记忆与上下文管理\n- 工具编排与工作流自动化\n\n## 核心概念\n\n### Agent（智能体）\n\nHermes 的核心单元，负责接收指令、规划步骤、执行任务。\n\n### Memory（记忆）\n\n三层记忆系统：\n- **短期记忆**: 当前会话上下文\n- **长期记忆**: 跨会话积累的知识\n- **向量记忆**: 基于语义检索的参考资料\n\n### Skills（技能）\n\n预置的能力包，包括搜索、编程、写作、数据分析等。\n\n## 与 OpenClaw 的区别\n\n| 特性 | OpenClaw | Hermes |\n|------|----------|--------|\n| 定位 | 通用框架 | 复杂任务 |\n| 工具调用 | 基础 | 高级编排 |\n| 记忆系统 | 简单 | 三层架构 |\n| 学习曲线 | 平缓 | 较陡 |', sort_order: 1 },
    { category: 'Hermes', title: '工作流编排：用 Hermes 实现自动化流水线', content: '## 工作流基础\n\nHermes 的工作流由多个步骤组成，每个步骤可以是：\n\n- 一个 Agent\n- 一个工具调用\n- 一个条件判断\n- 一个数据转换\n\n## 定义工作流\n\n```yaml\nworkflow:\n  name: code-review\n  steps:\n    - name: fetch-code\n      tool: git-diff\n      args:\n        repo: ${{input.repo}}\n\n    - name: analyze\n      agent: senior-reviewer\n      input: ${{steps.fetch-code.output}}\n\n    - name: report\n      tool: create-pr-comment\n      args:\n        content: ${{steps.analyze.output}}\n        repo: ${{input.repo}}\n```\n\n## 执行工作流\n\n```javascript\nconst result = await hermes.run(\'code-review\', {\n  repo: \'owner/repo\'\n});\n```\n\n## 条件分支\n\n```yaml\n- name: validate\n  if: \'{{steps.analyze.severity}}\' == \'high\'\n  then:\n    - tool: send-slack-alert\n  else:\n    - tool: log-info\n```', sort_order: 2 },
    { category: 'Hermes', title: '记忆系统：让 Agent 记住一切', content: '## 三层记忆架构\n\n```\n┌─────────────────┐\n│   Vector Store  │  ← 长期记忆（语义搜索）\n├─────────────────┤\n│  SQLite/Redis   │  ← 中期记忆（结构化数据）\n├─────────────────┤\n│   Conversation  │  ← 短期记忆（当前会话）\n└─────────────────┘\n```\n\n## 短期记忆\n\n对话上下文，自动管理：\n\n```javascript\nagent.addMessage({\n  role: \'user\',\n  content: \'分析这段代码...\'\n});\n```\n\n## 长期记忆\n\n持久化存储，跨会话使用：\n\n```javascript\n// 存储\nawait agent.remember(\n  \'用户偏好：喜欢使用 zsh 而不是 bash\'\n);\n\n// 检索\nconst memories = await agent.recall(\n  \'shell 配置偏好\'\n);\n```\n\n## 向量记忆\n\n基于语义相似度检索：\n\n```javascript\n// 添加文档\nawait agent.learn(\n  \'OpenClaw 部署最佳实践\',\n  \'本文档包含生产环境部署的注意事项...\'\n);\n\n// 语义搜索\nconst docs = await agent.search(\n  \'如何在 Kubernetes 部署 OpenClaw？\'\n);\n```', sort_order: 3 },
  ];
  const stmt = db.prepare(`
    INSERT INTO tutorials (category, title, content, sort_order)
    VALUES (?, ?, ?, ?)
  `);
  defaultTutorials.forEach((t) => {
    stmt.run(t.category, t.title, t.content, t.sort_order);
  });
}

console.log('数据库初始化完成');
module.exports = db;
