/**
 * 认证路由
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// 简单的用户存储（生产环境应使用数据库）
const users = new Map();

// 初始化管理员账号
users.set(process.env.ADMIN_USERNAME || 'admin', {
  id: '1',
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  name: '系统管理员',
  email: 'admin@kafka-manager.com',
  role: 'admin',
  avatar: null,
  createdAt: new Date().toISOString()
});

// 生成简单 token（生产环境应使用 JWT）
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Token 存储
const tokens = new Map();

/**
 * 登录
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  const user = users.get(username);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

  tokens.set(token, {
    userId: user.id,
    username: user.username,
    expiresAt
  });

  // 返回用户信息（不包含密码）
  const { password: _, ...userInfo } = user;

  res.json({
    success: true,
    data: {
      token,
      expiresAt: expiresAt.toISOString(),
      user: userInfo
    }
  });
});

/**
 * 登出
 */
router.post('/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (token) {
    tokens.delete(token);
  }

  res.json({
    success: true,
    message: '登出成功'
  });
});

/**
 * 获取当前用户信息
 */
router.get('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  const tokenData = tokens.get(token);
  
  if (!tokenData || new Date() > tokenData.expiresAt) {
    tokens.delete(token);
    return res.status(401).json({
      success: false,
      message: 'Token 已过期'
    });
  }

  const user = users.get(tokenData.username);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户不存在'
    });
  }

  const { password: _, ...userInfo } = user;

  res.json({
    success: true,
    data: userInfo
  });
});

/**
 * 更新用户信息
 */
router.put('/me', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  const tokenData = tokens.get(token);
  if (!tokenData) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效'
    });
  }

  const user = users.get(tokenData.username);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户不存在'
    });
  }

  const { name, email, avatar } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;
  if (avatar !== undefined) user.avatar = avatar;

  const { password: _, ...userInfo } = user;

  res.json({
    success: true,
    data: userInfo,
    message: '更新成功'
  });
});

/**
 * 修改密码
 */
router.put('/password', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  const tokenData = tokens.get(token);
  if (!tokenData) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效'
    });
  }

  const user = users.get(tokenData.username);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '用户不存在'
    });
  }

  const { oldPassword, newPassword } = req.body;

  if (user.password !== oldPassword) {
    return res.status(400).json({
      success: false,
      message: '原密码错误'
    });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: '新密码长度不能少于6位'
    });
  }

  user.password = newPassword;

  res.json({
    success: true,
    message: '密码修改成功'
  });
});

module.exports = router;
