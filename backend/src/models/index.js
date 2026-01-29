const sequelize = require('../db/database');
const User = require('./User');
const Settings = require('./Settings');

// 初始化数据库
async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // 同步模型 (alter: true 会根据模型定义更新表结构)
    await sequelize.sync({ alter: true });
    
    // 初始化管理员账号
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount === 0) {
      await User.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123', // 实际应用中应加密
        name: 'System Admin',
        email: 'admin@kafka-manager.com',
        role: 'admin'
      });
      console.log('Admin user initialized.');
    }
    
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = {
  sequelize,
  User,
  Settings,
  initDatabase
};
