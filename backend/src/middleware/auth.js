/**
 * 认证中间件
 */

// Token 存储引用（与 auth 路由共享）
const tokens = new Map();

/**
 * 验证 Token 中间件
 */
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  const tokenData = tokens.get(token);

  if (!tokenData) {
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    });
  }

  if (new Date() > tokenData.expiresAt) {
    tokens.delete(token);
    return res.status(401).json({
      success: false,
      message: '认证令牌已过期'
    });
  }

  // 将用户信息添加到请求对象
  req.user = {
    userId: tokenData.userId,
    username: tokenData.username
  };

  next();
}

/**
 * 可选认证中间件（不强制要求登录）
 */
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    const tokenData = tokens.get(token);
    if (tokenData && new Date() <= tokenData.expiresAt) {
      req.user = {
        userId: tokenData.userId,
        username: tokenData.username
      };
    }
  }

  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  tokens
};
