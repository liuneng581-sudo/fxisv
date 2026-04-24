const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');
const db = require('./db');

// ============ Rate Limiting ============
const rateLimit = require('express-rate-limit');

// 发送验证码限流: 5次/15分钟 (IP维度)
const sendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请15分钟后再试' }
});

// ============ CSRF Protection (P1) ============
// Double Submit Cookie pattern - 登录时生成，写操作验证
const csrfTokens = new Map(); // userId -> csrfToken

// 生成CSRF token
const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

// CSRF验证中间件 - 用于所有写操作
const csrfValidate = (req, res, next) => {
  // 只验证写操作
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }
  
  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromCookie = req.cookies?.csrf_token;
  
  if (!tokenFromHeader || !tokenFromCookie) {
    return res.status(403).json({ error: 'CSRF token缺失' });
  }
  
  if (tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ error: 'CSRF token无效' });
  }
  
  next();
};

// 邮箱维度限流 (P1-2)
const emailRateLimit = new Map(); // email -> [timestamp1, timestamp2, ...]

const checkEmailRateLimit = (email) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15分钟窗口
  const record = emailRateLimit.get(email) || [];
  const valid = record.filter(t => now - t < windowMs);
  emailRateLimit.set(email, valid);
  if (valid.length >= 5) return false;
  valid.push(now);
  return true;
};

// 登录限流: 10次/15分钟
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '登录尝试过多，请15分钟后再试' }
});

// 注册限流: 10次/15分钟
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '注册尝试过多，请15分钟后再试' }
});


// ============ 邮件发送配置 ============
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS;

const emailTransporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

const app = express();
const PORT = 3005;
const JWT_SECRET=process.env.JWT_SECRET;
if(!JWT_SECRET){console.error('JWT_SECRET is required');process.exit(1);}

// Trust proxy for X-Forwarded-For
app.set('trust proxy', 1);

// 中间件
app.use(cookieParser());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件 - 上传的图片
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Multer 配置 - 图片上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 },
  fileFilter: (req, file, cb) => {
    // 真实MIME检测防止MIME伪造 (P1安全)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // 先验证扩展名
    if (!allowedExts.includes(ext)) {
      return cb(new Error('只支持 JPG/PNG/GIF/WEBP 格式'));
    }
    
    // 读取文件头检测真实MIME (防止伪造)
    const fs = require('fs');
    const buf = Buffer.alloc(8);
    try {
      const fd = fs.openSync(file.path, 'r');
      fs.readSync(fd, buf, 0, 8, 0);
      fs.closeSync(fd);
      
      // JPEG: FF D8 FF
      // PNG: 89 50 4E 47
      // GIF: 47 49 46 38
      // WebP: 52 49 46 46 ... 57 45 42 50
      const isJPEG = buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF;
      const isPNG = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
      const isGIF = buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38;
      const isWebP = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
      
      // 检查 WebP 需确认 magic: 57 45 42 50
      let isWebPFull = false;
      if (isWebP && file.buffer) {
        const webpBuf = Buffer.alloc(4);
        try {
          const fd2 = fs.openSync(file.path, 'r');
          fs.readSync(fd2, webpBuf, 0, 4, 8);
          fs.closeSync(fd2);
          isWebPFull = webpBuf[0] === 0x57 && webpBuf[1] === 0x45 && webpBuf[2] === 0x42 && webpBuf[3] === 0x50;
        } catch {}
      }
      
      if (!isJPEG && !isPNG && !isGIF && !(isWebP && isWebPFull)) {
        return cb(new Error('文件格式无效或已损坏'));
      }
    } catch (err) {
      return cb(new Error('无法验证文件格式'));
    }
    
    cb(null, true);
  }
});

// 认证中间件
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: '请先登录' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'token无效' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
  next();
};

// 统一错误响应
const errorRes = (res, status, message, code) => res.status(status).json({ success: false, error: message, code });

// 审计日志
const auditLog = (userId, action, targetType, targetId, req, details) => {
  const ip = req.ip || req.connection?.remoteAddress || '';
  const userAgent = req.get('User-Agent') || '';
  try {
    db.prepare('INSERT INTO audit_log (user_id, action, target_type, target_id, ip, user_agent, details) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, action, targetType, targetId, ip, userAgent, details);
  } catch(e) { console.error('Audit log failed:', e.message); }
};


// ============ 认证相关 ============

// 存储验证码（生产环境建议用 Redis）
const verificationCodes = new Map();

// 登录失败追踪表 (P1安全: 5次失败/15分钟封禁IP)
const createLoginFailuresTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS login_failures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip TEXT NOT NULL,
      email TEXT DEFAULT '',
      attempts INTEGER DEFAULT 1,
      first_failure_at INTEGER NOT NULL,
      banned_until INTEGER DEFAULT 0
    )
  `);
};
createLoginFailuresTable();

// 封禁IP检查函数
const isIpBanned = (ip) => {
  const row = db.prepare('SELECT banned_until FROM login_failures WHERE ip = ? AND banned_until > ? ORDER BY id DESC LIMIT 1').get(ip, Date.now());
  return row && row.banned_until > Date.now();
};

// 记录失败并检查是否需要封禁
const recordLoginFailure = (ip, email) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15分钟窗口
  const existing = db.prepare('SELECT id, attempts, first_failure_at FROM login_failures WHERE ip = ? AND (banned_until = 0 OR banned_until <= ?) ORDER BY id DESC LIMIT 1').get(ip, now);
  
  if (existing) {
    const elapsed = now - existing.first_failure_at;
    if (elapsed > windowMs) {
      // 窗口过期，重新开始计数
      db.prepare('INSERT INTO login_failures (ip, email, attempts, first_failure_at) VALUES (?, ?, 1, ?)').run(ip, email || '', now);
    } else {
      const newAttempts = existing.attempts + 1;
      if (newAttempts >= 5) {
        // 5次失败，封禁15分钟
        const bannedUntil = now + 15 * 60 * 1000;
        db.prepare('INSERT INTO login_failures (ip, email, attempts, first_failure_at, banned_until) VALUES (?, ?, ?, ?, ?)').run(ip, email || '', newAttempts, existing.first_failure_at, bannedUntil);
      } else {
        db.prepare('UPDATE login_failures SET attempts = ?, email = ? WHERE id = ?').run(newAttempts, email || '', existing.id);
      }
    }
  } else {
    db.prepare('INSERT INTO login_failures (ip, email, attempts, first_failure_at) VALUES (?, ?, 1, ?)').run(ip, email || '', now);
  }
};

// 清除成功登录的失败记录
const clearLoginFailures = (ip) => {
  db.prepare('DELETE FROM login_failures WHERE ip = ?').run(ip);
};



// 发送邮箱验证码
app.post('/api/auth/send-code', sendCodeLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }
    if (email.length > 100) {
      return res.status(400).json({ error: '邮箱地址过长' });
    }

    // 邮箱维度限流 (P1-2)
    if (!checkEmailRateLimit(email)) {
      return res.status(429).json({ error: '该邮箱发送次数超限，请15分钟后再试' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    verificationCodes.set(email, { code, expiresAt });

    await emailTransporter.sendMail({
      from: `"蜂厂长的开源库" <${EMAIL_USER}>`,
      to: email,
      subject: '🐝 蜂厂长的开源库 - 注册验证码',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 24px; color: #1d1d1f; margin: 0;">蜂厂长的开源库</h1>
          </div>
          <div style="background: #f5f5f7; border-radius: 16px; padding: 32px; text-align: center;">
            <p style="color: #86868b; font-size: 15px; margin: 0 0 16px;">您的注册验证码</p>
            <div style="font-size: 48px; font-weight: 700; color: #1d1d1f; letter-spacing: 8px; font-family: SF Mono, Menlo, monospace;">${code}</div>
            <p style="color: #86868b; font-size: 13px; margin: 24px 0 0;">验证码 5 分钟内有效，请勿泄露给他人</p>
          </div>
        </div>
      `
    });

    res.json({ success: true, message: '验证码已发送' });
  } catch (err) {
    console.error('发送邮件失败:', err);
    res.status(500).json({ error: '邮件发送失败，请检查邮箱地址是否正确' });
  }
});

// 注册（需先获取验证码）
app.post('/api/auth/register', registerLimiter, (req, res) => {
  try {
    const { email, phone, password, nickname, code } = req.body;
    if (!email || !phone || !password || !code) {
      return res.status(400).json({ error: '所有字段必填' });
    }
    if (email.length > 100) {
      return res.status(400).json({ error: '邮箱地址过长' });
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    if (phone.length > 20) {
      return res.status(400).json({ error: '手机号过长' });
    }
    if (nickname && nickname.length > 50) {
      return res.status(400).json({ error: '昵称不能超过50位' });
    }
    if (password.length < 6 || password.length > 100) {
      return res.status(400).json({ error: '密码长度需在6-100位之间' });
    }

    const stored = verificationCodes.get(email);
    if (!stored || stored.code !== code) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
    if (Date.now() > stored.expiresAt) {
      verificationCodes.delete(email);
      return res.status(400).json({ error: '验证码已过期，请重新获取' });
    }
    verificationCodes.delete(email);

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(email, phone);
    if (existing) return res.status(400).json({ error: '邮箱或手机号已注册' });

    const hash = bcrypt.hashSync(password, 12);
    const result = db.prepare(`
      INSERT INTO users (email, phone, password, nickname, points)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, phone, hash, nickname || '', 10);

    db.prepare(`
      INSERT INTO points_history (user_id, type, amount, balance, description)
      VALUES (?, 'signin', ?, ?, '新用户注册奖励')
    `).run(result.lastInsertRowid, 10, 10);

    const token = jwt.sign({ id: result.lastInsertRowid, email, role: 'user' }, JWT_SECRET, { expiresIn: '30d' });
    auditLog(result.lastInsertRowid, 'register', 'user', result.lastInsertRowid, req, '新用户注册');
    res.json({ token, user: { id: result.lastInsertRowid, email, phone, nickname, points: 10, role: 'user' } });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// 登录
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    
    // 生成CSRF token并设置cookie (P1)
    const csrfToken = generateCsrfToken();
    csrfTokens.set(user.id, csrfToken);
    res.cookie('csrf_token', csrfToken, { httpOnly: false, secure: false, sameSite: 'strict', maxAge: 24 * 60 * 60 * 1000 });
    
    res.json({
      token,
      user: { id: user.id, email: user.email, phone: user.phone, nickname: user.nickname, avatar: user.avatar, points: user.points, role: user.role }
    });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// 获取当前用户
app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, phone, nickname, avatar, points, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

// 更新用户信息
app.put('/api/auth/profile', auth, csrfValidate, (req, res) => {
  try {
    const { nickname, avatar } = req.body;
    if (nickname && nickname.length > 50) {
      return res.status(400).json({ error: '昵称不能超过50位' });
    }
    if (avatar && avatar.length > 500) {
      return res.status(400).json({ error: '头像URL过长' });
    }
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(nickname || '', avatar || '', req.user.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// 修改密码
app.put('/api/auth/password', auth, csrfValidate, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(400).json({ error: '原密码错误' });
    }
    const hash = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.user.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 签到 ============

app.post('/api/signin', auth, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare('SELECT id FROM signin WHERE user_id = ? AND signin_date = ?').get(req.user.id, today);
    if (existing) return res.status(400).json({ error: '今日已签到' });

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const consecutive = db.prepare('SELECT id FROM signin WHERE user_id = ? AND signin_date = ?').get(req.user.id, yesterday);
    let points = consecutive ? 2 : 1;

    db.prepare('INSERT INTO signin (user_id, signin_date, points_earned) VALUES (?, ?, ?)').run(req.user.id, today, points);

    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
    const newBalance = user.points + points;
    db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newBalance, req.user.id);
    db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, 'signin', points, newBalance, consecutive ? '连续签到奖励' : '每日签到');

    res.json({ success: true, points, balance: newBalance, consecutive: !!consecutive });
    auditLog(req.user.id, 'signin', 'signin', 0, req, '签到获得' + points + '积分');
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.get('/api/signin/status', auth, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const signedIn = !!db.prepare('SELECT id FROM signin WHERE user_id = ? AND signin_date = ?').get(req.user.id, today);

    let consecutive = 0;
    let date = new Date();
    while (true) {
      const d = date.toISOString().split('T')[0];
      const found = db.prepare('SELECT id FROM signin WHERE user_id = ? AND signin_date = ?').get(req.user.id, d);
      if (found) consecutive++;
      else break;
      date.setDate(date.getDate() - 1);
    }

    res.json({ signedIn, consecutive, today });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 积分相关 ============

// ============ 积分规则 ============

// ============ 积分规则（数据库驱动） ============

app.get('/api/points/rules', (req, res) => {
  try {
    const rules = { earn: [], spend: [], other: [] };
    const rows = db.prepare('SELECT category, action, points, description FROM points_rules ORDER BY sort_order ASC').all();
    rows.forEach(r => {
      if (rules[r.category]) rules[r.category].push({ action: r.action, points: r.points, desc: r.description });
    });
    res.json({ rules });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 积分规则管理（管理员） ============

app.get('/api/admin/points-rules', auth, adminOnly, (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM points_rules ORDER BY category, sort_order ASC').all();
    res.json({ list: rows });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/admin/points-rules', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { category, action, points = 0, description = '', sort_order = 0 } = req.body;
    if (!category || !action) return res.status(400).json({ error: '分类和动作必填' });
    const result = db.prepare('INSERT INTO points_rules (category, action, points, description, sort_order) VALUES (?, ?, ?, ?, ?)')
      .run(category, action, points, description, sort_order);
    const row = db.prepare('SELECT * FROM points_rules WHERE id = ?').get(result.lastInsertRowid);
    res.json({ success: true, rule: row });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/points-rules/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { category, action, points, description, sort_order } = req.body;
    const updates = [];
    const params = [];
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (action !== undefined) { updates.push('action = ?'); params.push(action); }
    if (points !== undefined) { updates.push('points = ?'); params.push(points); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
    if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });
    params.push(req.params.id);
    db.prepare(`UPDATE points_rules SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const row = db.prepare('SELECT * FROM points_rules WHERE id = ?').get(req.params.id);
    res.json({ success: true, rule: row });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/points-rules/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    db.prepare('DELETE FROM points_rules WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});


app.get('/api/points/history', auth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const list = db.prepare(`
      SELECT * FROM points_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(req.user.id, Number(limit), Number(offset));
    const total = db.prepare('SELECT COUNT(*) as count FROM points_history WHERE user_id = ?').get(req.user.id).count;
    res.json({ list, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});


// ============ 用户兑换记录 ============

app.get('/api/exchanges', auth, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const list = db.prepare(`
      SELECT e.*, t.name as treasure_name, t.image as treasure_image
      FROM exchanges e
      LEFT JOIN treasures t ON e.treasure_id = t.id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC LIMIT ? OFFSET ?
    `).all(req.user.id, Number(limit), Number(offset));
    const total = db.prepare('SELECT COUNT(*) as count FROM exchanges WHERE user_id = ?').get(req.user.id).count;
    res.json({ list, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 求助帖子 ============

app.get('/api/posts', (req, res) => {
  try {
    const { category, status, page = 1, limit = 20, keyword, user_id } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    if (category) { where += ' AND p.category = ?'; params.push(category); }
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (user_id) { where += ' AND p.user_id = ?'; params.push(user_id); }
    if (keyword) { where += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

    const list = db.prepare(`
      SELECT p.*, u.nickname, u.avatar, u.email,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), Number(offset));
    const total = db.prepare(`SELECT COUNT(*) as count FROM posts p WHERE ${where}`).get(...params).count;

    res.json({ list: list.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.get('/api/posts/:id', (req, res) => {
  try {
    const post = db.prepare(`
      SELECT p.*, u.nickname, u.avatar, u.email
      FROM posts p LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });

    db.prepare('UPDATE posts SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);

    const comments = db.prepare(`
      SELECT c.*, u.nickname, u.avatar
      FROM comments c LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? ORDER BY c.is_best_answer DESC, c.created_at ASC
    `).all(req.params.id);

    res.json({ ...post, images: JSON.parse(post.images || '[]'), comments });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/posts', auth, csrfValidate, (req, res) => {
  try {
    const { title, content, images, category = 'help', points_reward = 0 } = req.body;
    if (!title || !content) return res.status(400).json({ error: '标题和内容必填' });
    if (title.length > 200) return res.status(400).json({ error: '标题不能超过200字' });
    if (content.length > 50000) return res.status(400).json({ error: '内容不能超过50000字' });

    const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);

    if (points_reward > 0) {
      if (user.points < points_reward) return res.status(400).json({ error: '积分不足' });
      const newBalance = user.points - points_reward;
      db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newBalance, req.user.id);
      db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, 'deduct', -points_reward, newBalance, `悬赏: ${title}`);
    }

    const result = db.prepare(`
      INSERT INTO posts (user_id, category, title, content, images, points_reward)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, category, title, content, JSON.stringify(images || []), points_reward);

    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/posts/:id', auth, csrfValidate, (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });

    if (req.user.role !== 'admin' && post.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权删除' });
    }

    // 删除前处理悬赏积分
    if (post.points_reward > 0) {
      if (post.status === 'open') {
        // open: 退积分给发帖人
        const user = db.prepare('SELECT points FROM users WHERE id = ?').get(post.user_id);
        const newBalance = user.points + post.points_reward;
        db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newBalance, post.user_id);
        db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
          .run(post.user_id, 'exchange', post.points_reward, newBalance, '删帖退返悬赏: ' + post.title);
      } else if (post.status === 'solved') {
        // solved: 从采纳者追回积分，退还给发帖人
        const bestAnswer = db.prepare('SELECT user_id FROM comments WHERE post_id = ? AND is_best_answer = 1').get(req.params.id);
        if (bestAnswer) {
          const answererUser = db.prepare('SELECT points FROM users WHERE id = ?').get(bestAnswer.user_id);
          const askerUser = db.prepare('SELECT points FROM users WHERE id = ?').get(post.user_id);
          db.prepare('UPDATE users SET points = ? WHERE id = ?').run(answererUser.points - post.points_reward, bestAnswer.user_id);
          db.prepare('UPDATE users SET points = ? WHERE id = ?').run(askerUser.points + post.points_reward, post.user_id);
          db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
            .run(bestAnswer.user_id, 'deduct', -post.points_reward, answererUser.points - post.points_reward, '删帖追回: ' + post.title);
          db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
            .run(post.user_id, 'refund', post.points_reward, askerUser.points + post.points_reward, '删帖返积分: ' + post.title);
        }
      }
    }

    // 清理关联comments和notifications
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(req.params.id);
    db.prepare("DELETE FROM notifications WHERE related_id = ? AND type IN ('answer_accepted', 'new_answer')").run(req.params.id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    auditLog(req.user.id, 'delete_post', 'post', req.params.id, req, '删除帖子');
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/posts/:id/comments', auth, csrfValidate, (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: '内容必填' });
    if (content.length > 5000) return res.status(400).json({ error: '评论不能超过5000字' });

    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });

    const result = db.prepare('INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)')
      .run(req.params.id, req.user.id, content);

    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// 采纳回答
app.post('/api/posts/:id/accept', auth, csrfValidate, (req, res) => {
  try {
    const { comment_id } = req.body;
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });
    if (post.user_id !== req.user.id) return res.status(403).json({ error: '只有发帖人可以采纳回答' });
    if (post.status === 'solved') return res.status(400).json({ error: '该帖子已采纳过回答' });

    const comment = db.prepare('SELECT * FROM comments WHERE id = ? AND post_id = ?').get(comment_id, req.params.id);
    if (!comment) return res.status(404).json({ error: '回答不存在' });

    db.prepare('UPDATE comments SET is_best_answer = 0 WHERE post_id = ?').run(req.params.id);
    db.prepare('UPDATE comments SET is_best_answer = 1 WHERE id = ?').run(comment_id);
    db.prepare("UPDATE posts SET status = 'solved' WHERE id = ?").run(req.params.id);

    if (post.points_reward > 0) {
      const answerer = db.prepare('SELECT points FROM users WHERE id = ?').get(comment.user_id);
      const asker = db.prepare('SELECT points FROM users WHERE id = ?').get(post.user_id);
      const newAskBalance = asker.points - post.points_reward;
      const newAnsBalance = answerer.points + post.points_reward;
      db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newAnsBalance, comment.user_id);
      db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newAskBalance, post.user_id);
      db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
        .run(post.user_id, 'deduct', -post.points_reward, newAskBalance, '悬赏采纳: ' + post.title);
      db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
        .run(comment.user_id, 'reward', post.points_reward, newAnsBalance, '被采纳回答: ' + post.title);
    }

    // 通知回答者：回答被采纳
    db.prepare('INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)')
      .run(comment.user_id, 'answer_accepted', '回答被采纳', post.points_reward > 0 ? '您的回答被采纳为最佳答案，获得 ' + post.points_reward + ' 积分' : '您的回答被采纳为最佳答案', post.id);

    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/comments/:id', auth, csrfValidate, (req, res) => {
  try {
    const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(req.params.id);
    if (!comment) return res.status(404).json({ error: '回帖不存在' });

    if (req.user.role !== 'admin' && comment.user_id !== req.user.id) {
      return res.status(403).json({ error: '无权删除' });
    }

    db.prepare('DELETE FROM comments WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ Notifications ============
app.get('/api/notifications', auth, (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
    res.json({ list });
  } catch (err) { errorRes(res, 500, err.message, 'INTERNAL_ERROR'); }
});

app.get('/api/notifications/unread-count', auth, (req, res) => {
  try {
    const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
    res.json({ count: row.count });
  } catch (err) { errorRes(res, 500, err.message, 'INTERNAL_ERROR'); }
});

app.put('/api/notifications/:id/read', auth, csrfValidate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) { errorRes(res, 500, err.message, 'INTERNAL_ERROR'); }
});

app.put('/api/notifications/read-all', auth, csrfValidate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) { errorRes(res, 500, err.message, 'INTERNAL_ERROR'); }
});

// ============ Skills ============

app.get('/api/skills', (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM skills';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order ASC';
    res.json({ list: db.prepare(sql).all(...params) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ Tools ============

app.get('/api/tools', (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM tools';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order ASC';
    res.json({ list: db.prepare(sql).all(...params) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});


// ============ Models ============
app.get('/api/models', (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM models';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order ASC';
    res.json({ list: db.prepare(sql).all(...params) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});
// ============ 教程 ============

app.get('/api/tutorials', (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM tutorials';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order ASC';
    res.json({ list: db.prepare(sql).all(...params) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.get('/api/tutorials/:id', (req, res) => {
  try {
    const tutorial = db.prepare('SELECT * FROM tutorials WHERE id = ?').get(req.params.id);
    if (!tutorial) return res.status(404).json({ error: '文档不存在' });
    res.json({ tutorial });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});


// ============ 积分商品 ============

app.get('/api/treasures', (req, res) => {
  try {
    const { type } = req.query;
    let sql = 'SELECT * FROM treasures WHERE (stock = -1 OR stock > 0)';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    sql += ' ORDER BY sort_order ASC';
    res.json({ list: db.prepare(sql).all(...params) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/treasures/exchange', auth, csrfValidate, (req, res) => {
  try {
    const { treasure_id } = req.body;

    // 使用事务防止竞态条件 (P1安全: 防止超卖和双花)
    const exchangeId = db.transaction(() => {
      const treasure = db.prepare('SELECT * FROM treasures WHERE id = ?').get(treasure_id);
      if (!treasure) throw Object.assign(new Error('商品不存在'), { status: 404 });
      if (treasure.stock === 0) throw Object.assign(new Error('库存不足'), { status: 400 });

      const user = db.prepare('SELECT points FROM users WHERE id = ?').get(req.user.id);
      if (!user) throw Object.assign(new Error('用户不存在'), { status: 404 });
      if ((user.points || 0) < treasure.points_price) {
        throw Object.assign(new Error('积分不足'), { status: 400 });
      }

      const newBalance = user.points - treasure.points_price;
      db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newBalance, req.user.id);
      db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.id, 'exchange', -treasure.points_price, newBalance, `兑换: ${treasure.name}`);

      const result = db.prepare(`
        INSERT INTO exchanges (user_id, treasure_id, points_spent, token_amount, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(req.user.id, treasure_id, treasure.points_price, treasure.token_amount || 0);

      if (treasure.stock > 0) {
        const updated = db.prepare('UPDATE treasures SET stock = stock - 1 WHERE id = ? AND stock > 0 RETURNING id').get(treasure_id);
        if (!updated) throw Object.assign(new Error('库存不足'), { status: 400 });
      }

      return result.lastInsertRowid;
    })();

    auditLog(req.user.id, 'exchange', 'treasure', treasure_id, req, '兑换' + treasure_id + '，消耗积分');
    res.json({ success: true, exchange_id: exchangeId });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message });
  }
});

app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    let sql = 'SELECT id, email, phone, nickname, avatar, points, role, created_at FROM users WHERE 1=1';
    const params = [];
    if (search) { sql += ' AND (email LIKE ? OR nickname LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const list = db.prepare(sql).all(...params, Number(limit), Number(offset));
    const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    res.json({ list, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/users/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/users/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { nickname, avatar, points, role, reason } = req.body;
    const updates = [];
    const params = [];

    // 记录积分变更前的余额
    const oldUser = db.prepare('SELECT points FROM users WHERE id = ?').get(req.params.id);
    const oldPoints = oldUser ? oldUser.points : 0;

    if (nickname !== undefined) {
      if (nickname.length > 50) return res.status(400).json({ error: '昵称不能超过50位' });
      updates.push('nickname = ?'); params.push(nickname);
    }
    if (avatar !== undefined) { updates.push('avatar = ?'); params.push(avatar); }
    if (points !== undefined) { updates.push('points = ?'); params.push(Number(points)); }
    if (role !== undefined) { updates.push('role = ?'); params.push(role); }
    if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    // 积分变更时写入流水
    if (points !== undefined && Number(points) !== oldPoints) {
      const newBalance = Number(points);
      auditLog(req.params.id, 'admin_adjust_points', 'user', req.params.id, req, '管理员调整积分: ' + oldPoints + ' -> ' + Number(points));
      const diff = newBalance - oldPoints;
      const desc = reason ? `管理员调整: ${reason}` : '管理员调整积分';
      db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
        .run(req.params.id, 'admin', diff, newBalance, desc);
    }

    const user = db.prepare('SELECT id, email, phone, nickname, avatar, points, role, created_at FROM users WHERE id = ?').get(req.params.id);
    res.json({ success: true, user });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 用户积分流水（管理员） ============

app.get('/api/admin/users/:id/points-history', auth, adminOnly, (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const list = db.prepare(`
      SELECT * FROM points_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(req.params.id, Number(limit), Number(offset));
    const total = db.prepare('SELECT COUNT(*) as count FROM points_history WHERE user_id = ?').get(req.params.id).count;
    res.json({ list, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ OpenClaw/Hermes 教程管理 ============

app.get('/api/admin/tutorials', auth, adminOnly, (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM tutorials';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order ASC';
    res.json({ list: db.prepare(sql).all(...params) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/admin/tutorials', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { category, title, content, sort_order = 0 } = req.body;
    if (!category || !title) return res.status(400).json({ error: '分类和标题必填' });
    const result = db.prepare('INSERT INTO tutorials (category, title, content, sort_order) VALUES (?, ?, ?, ?)')
      .run(category, title, content || '', sort_order);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/tutorials/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { title, content, sort_order } = req.body;
    db.prepare('UPDATE tutorials SET title = ?, content = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(title, content || '', sort_order || 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/tutorials/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    db.prepare('DELETE FROM tutorials WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ Skills 管理 ============

app.get('/api/admin/skills', auth, adminOnly, (req, res) => {
  try {
    res.json({ list: db.prepare('SELECT * FROM skills ORDER BY sort_order ASC').all() });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/admin/skills', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { name, description, github_url, icon, category, sort_order = 0 } = req.body;
    if (!name) return res.status(400).json({ error: '名称必填' });
    const result = db.prepare('INSERT INTO skills (name, description, github_url, icon, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name, description || '', github_url || '', icon || '', category || 'OpenClaw', sort_order);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/skills/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { name, description, github_url, icon, category, sort_order } = req.body;
    db.prepare('UPDATE skills SET name = ?, description = ?, github_url = ?, icon = ?, category = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, description || '', github_url || '', icon || '', category || 'OpenClaw', sort_order || 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/skills/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    db.prepare('DELETE FROM skills WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ Tools 管理 ============

app.get('/api/admin/tools', auth, adminOnly, (req, res) => {
  try {
    res.json({ list: db.prepare('SELECT * FROM tools ORDER BY sort_order ASC').all() });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/admin/tools', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { name, description, icon, url, category, sort_order = 0 } = req.body;
    if (!name) return res.status(400).json({ error: '名称必填' });
    const result = db.prepare('INSERT INTO tools (name, description, icon, url, category, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(name, description || '', icon || '', url || '', category || 'tools', sort_order);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/tools/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { name, description, icon, url, category, sort_order } = req.body;
    db.prepare('UPDATE tools SET name = ?, description = ?, icon = ?, url = ?, category = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, description || '', icon || '', url || '', category || 'tools', sort_order || 0, req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/tools/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    db.prepare('DELETE FROM tools WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});


// ─── Admin: Models ───────────────────────────────────────────────────
app.get('/api/admin/models', auth, adminOnly, (req, res) => {
  try {
    const list = db.prepare('SELECT * FROM models ORDER BY sort_order ASC').all();
    res.json({ list });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/admin/models', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { name, description, icon, url, category, sort_order, image } = req.body;
    if (!name) return res.status(400).json({ error: '名称不能为空' });
    const result = db.prepare(
      'INSERT INTO models (name, description, icon, url, category, sort_order, image) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, description || '', icon || '', url || '', category || '', sort_order || 0, image || '');
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/models/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { name, description, icon, url, category, sort_order, image } = req.body;
    if (!name) return res.status(400).json({ error: '名称不能为空' });
    db.prepare(
      'UPDATE models SET name = ?, description = ?, icon = ?, url = ?, category = ?, sort_order = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(name, description || '', icon || '', url || '', category || '', sort_order || 0, image || '', req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/models/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    db.prepare('DELETE FROM models WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 求助管理 (Posts Admin CRUD) ============

app.get('/api/admin/posts', auth, adminOnly, (req, res) => {
  try {
    const { page = 1, limit = 20, category, status, keyword } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    if (category) { where += ' AND p.category = ?'; params.push(category); }
    if (status) { where += ' AND p.status = ?'; params.push(status); }
    if (keyword) { where += ' AND (p.title LIKE ? OR p.content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    const list = db.prepare(`
      SELECT p.*, u.nickname, u.email
      FROM posts p LEFT JOIN users u ON p.user_id = u.id
      WHERE ${where} ORDER BY p.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, Number(limit), Number(offset));
    const total = db.prepare(`SELECT COUNT(*) as count FROM posts p WHERE ${where}`).get(...params).count;
    res.json({ list: list.map(p => ({ ...p, images: JSON.parse(p.images || '[]') })), total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/admin/posts', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { user_id, category, title, content, images, points_reward = 0, status = 'pending' } = req.body;
    if (!title || !content) return res.status(400).json({ error: '标题和内容必填' });
    if (title.length > 200) return res.status(400).json({ error: '标题不能超过200字' });
    if (content.length > 50000) return res.status(400).json({ error: '内容不能超过50000字' });
    if (!user_id) return res.status(400).json({ error: '用户ID必填' });

    const result = db.prepare(`
      INSERT INTO posts (user_id, category, title, content, images, points_reward, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, category || 'help', title, content, JSON.stringify(images || []), points_reward, status);

    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/posts/:id', auth, adminOnly, csrfValidate, (req, res) => {
  try {
    const { category, title, content, images, points_reward, status, view_count } = req.body;
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });

    const updates = [];
    const params = [];
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (content !== undefined) { updates.push('content = ?'); params.push(content); }
    if (images !== undefined) { updates.push('images = ?'); params.push(JSON.stringify(images)); }
    if (points_reward !== undefined) { updates.push('points_reward = ?'); params.push(points_reward); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (view_count !== undefined) { updates.push('view_count = ?'); params.push(view_count); }
    if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);

    db.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    const updated = db.prepare(`
      SELECT p.*, u.nickname, u.email
      FROM posts p LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(req.params.id);
    res.json({ success: true, post: { ...updated, images: JSON.parse(updated.images || '[]') } });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/posts/:id', auth, adminOnly, (req, res) => {
  try {
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: '帖子不存在' });

    // 删除前处理悬赏积分
    if (post.points_reward > 0) {
      if (post.status === 'open') {
        // open: 退积分给发帖人
        const user = db.prepare('SELECT points FROM users WHERE id = ?').get(post.user_id);
        const newBalance = user.points + post.points_reward;
        db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newBalance, post.user_id);
        db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
          .run(post.user_id, 'refund', post.points_reward, newBalance, '管理员删除帖子退返悬赏积分');
      } else if (post.status === 'solved') {
        // solved: 从采纳者追回积分，退还给发帖人
        const bestAnswer = db.prepare('SELECT user_id FROM comments WHERE post_id = ? AND is_best_answer = 1').get(req.params.id);
        if (bestAnswer) {
          const answererUser = db.prepare('SELECT points FROM users WHERE id = ?').get(bestAnswer.user_id);
          const askerUser = db.prepare('SELECT points FROM users WHERE id = ?').get(post.user_id);
          db.prepare('UPDATE users SET points = ? WHERE id = ?').run(answererUser.points - post.points_reward, bestAnswer.user_id);
          db.prepare('UPDATE users SET points = ? WHERE id = ?').run(askerUser.points + post.points_reward, post.user_id);
          db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
            .run(bestAnswer.user_id, 'deduct', -post.points_reward, answererUser.points - post.points_reward, '管理员删帖追回: ' + post.title);
          db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
            .run(post.user_id, 'refund', post.points_reward, askerUser.points + post.points_reward, '管理员删帖返积分: ' + post.title);
        }
      }
    }

    // 清理关联comments和notifications
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(req.params.id);
    db.prepare("DELETE FROM notifications WHERE related_id = ? AND type IN ('answer_accepted', 'new_answer')").run(req.params.id);
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 积分商品管理 ============

app.get('/api/admin/treasures', auth, adminOnly, (req, res) => {
  try {
    res.json({ list: db.prepare('SELECT * FROM treasures ORDER BY sort_order ASC').all() });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.post('/api/admin/treasures', auth, adminOnly, (req, res) => {
  try {
    const { name, description, points_price, type, token_amount, stock, sort_order = 0, image = '' } = req.body;
    if (!name || !points_price) return res.status(400).json({ error: '名称和积分价格必填' });
    const result = db.prepare('INSERT INTO treasures (name, description, points_price, type, token_amount, stock, sort_order, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(name, description || '', points_price, type || 'capability', token_amount || 0, stock ?? -1, sort_order, image);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/treasures/:id', auth, adminOnly, (req, res) => {
  try {
    const { name, description, points_price, type, token_amount, stock, sort_order, image } = req.body;
    db.prepare('UPDATE treasures SET name = ?, description = ?, points_price = ?, type = ?, token_amount = ?, stock = ?, sort_order = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(name, description || '', points_price, type || 'capability', token_amount || 0, stock ?? -1, sort_order || 0, image || '', req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.delete('/api/admin/treasures/:id', auth, adminOnly, (req, res) => {
  try {
    db.prepare('DELETE FROM treasures WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 兑换记录管理 ============

app.get('/api/admin/exchanges', auth, adminOnly, (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND e.status = ?'; params.push(status); }
    const list = db.prepare(`
      SELECT e.*, u.nickname, u.email, t.name as treasure_name, t.type as treasure_type
      FROM exchanges e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN treasures t ON e.treasure_id = t.id
      WHERE ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, Number(limit), Number(offset));
    const total = db.prepare(`SELECT COUNT(*) as count FROM exchanges e WHERE ${where}`).get(...params).count;
    res.json({ list, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

app.put('/api/admin/exchanges/:id', auth, adminOnly, (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '状态必须是 approved 或 rejected' });
    }

    const exchange = db.prepare(`
      SELECT e.*, t.type as treasure_type, t.token_amount, t.name as treasure_name
      FROM exchanges e
      LEFT JOIN treasures t ON e.treasure_id = t.id
      WHERE e.id = ?
    `).get(req.params.id);

    if (!exchange) return res.status(404).json({ error: '兑换记录不存在' });
    if (exchange.status !== 'pending') return res.status(400).json({ error: '该兑换记录已处理' });

    db.prepare('UPDATE exchanges SET status = ? WHERE id = ?').run(status, req.params.id);

    if (status === 'approved' && exchange.treasure_type === 'token') {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(exchange.user_id);
      const newTokenBalance = (user.token_balance || 0) + exchange.token_amount;
      db.prepare('UPDATE users SET token_balance = ? WHERE id = ?').run(newTokenBalance, exchange.user_id);
      db.prepare(`
        INSERT INTO token_history (user_id, type, amount, balance, description)
        VALUES (?, 'exchange_reward', ?, ?, '兑换奖励')
      `).run(exchange.user_id, exchange.token_amount, newTokenBalance);
      // 发送通知：兑换通过
      db.prepare('INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)')
        .run(exchange.user_id, 'exchange_approved', '兑换审核通过', `您的「${exchange.treasure_name || '商品'}」兑换申请已通过，Token已发放到账户`, exchange.id);
    }

    // 拒绝兑换：返还积分
    if (status === 'rejected' && exchange.points_spent > 0) {
      const user = db.prepare('SELECT points FROM users WHERE id = ?').get(exchange.user_id);
      const newBalance = (user.points || 0) + exchange.points_spent;
      db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newBalance, exchange.user_id);
      db.prepare('INSERT INTO points_history (user_id, type, amount, balance, description) VALUES (?, ?, ?, ?, ?)')
        .run(exchange.user_id, 'exchange', exchange.points_spent, newBalance, `兑换被拒绝退还: ${exchange.treasure_name || '商品 #' + exchange.treasure_id}`);
      // 发送通知：兑换被拒绝
      db.prepare('INSERT INTO notifications (user_id, type, title, content, related_id) VALUES (?, ?, ?, ?, ?)')
        .run(exchange.user_id, 'exchange_rejected', '兑换审核被拒绝', `您的「${exchange.treasure_name || '商品'}」兑换申请已被拒绝，${exchange.points_spent}积分已返还到您的账户`, exchange.id);
      // 恢复库存
      db.prepare('UPDATE treasures SET stock = stock + 1 WHERE id = ? AND stock >= 0').run(exchange.treasure_id);
    }

    const updated = db.prepare(`
      SELECT e.*, u.nickname, u.email, t.name as treasure_name
      FROM exchanges e
      LEFT JOIN users u ON e.user_id = u.id
      LEFT JOIN treasures t ON e.treasure_id = t.id
      WHERE e.id = ?
    `).get(req.params.id);

    res.json({ success: true, exchange: updated });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 图片上传 ============

app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请上传图片' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 统计概览 ============

app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  try {
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const posts = db.prepare('SELECT COUNT(*) as count FROM posts').get().count;
    const comments = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
    const exchanges = db.prepare('SELECT COUNT(*) as count FROM exchanges').get().count;
    res.json({ users, posts, comments, exchanges });
  } catch (err) {
    errorRes(res, 500, err.message, 'INTERNAL_ERROR');
  }
});

// ============ 启动服务 ============

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API 服务运行在 http://localhost:${PORT}`);
});
