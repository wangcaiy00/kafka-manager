/**
 * 认证路由
 */
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { User } = require('../models');

// 生成简单 token（生产环境应使用 JWT）
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Token 存储 (实际可以使用 Redis 或数据库)
const tokens = new Map();

/**
 * 登录
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  try {
    const user = await User.findOne({ where: { username } });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时

    tokens.set(token, {
      userId: user.id,
      username: user.username,
      expiresAt
    });

    res.json({
      success: true,
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败'
    });
  }
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
router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  const tokenInfo = tokens.get(token);
  if (!tokenInfo || tokenInfo.expiresAt < new Date()) {
    tokens.delete(token);
    return res.status(401).json({
      success: false,
      message: 'Token 无效或已过期'
    });
  }

  try {
    const user = await User.findByPk(tokenInfo.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

/**
 * 更新用户信息
 */
router.put('/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  const tokenInfo = tokens.get(token);
  if (!tokenInfo) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效'
    });
  }

  try {
    const user = await User.findByPk(tokenInfo.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    const { name, email, avatar } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: '更新失败'
    });
  }
});

/**
 * 修改密码
 */
router.put('/password', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const { oldPassword, newPassword } = req.body;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  const tokenInfo = tokens.get(token);
  if (!tokenInfo) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效'
    });
  }

  try {
    const user = await User.findByPk(tokenInfo.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.password !== oldPassword) {
      return res.status(400).json({
        success: false,
        message: '原密码错误'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: '密码修改失败'
    });
  }
});

module.exports = router;
