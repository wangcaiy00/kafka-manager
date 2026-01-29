/**
 * 设置路由
 */
const express = require('express');
const router = express.Router();
const { Settings } = require('../models');

/**
 * 获取所有设置
 */
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.findAll();
    const result = {};
    settings.forEach(s => {
      result[s.key] = s.value;
    });
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: '获取设置失败'
    });
  }
});

/**
 * 更新设置
 */
router.post('/', async (req, res) => {
  const newSettings = req.body;
  
  try {
    // 批量更新或插入
    for (const [key, value] of Object.entries(newSettings)) {
      await Settings.upsert({ key, value });
    }

    res.json({
      success: true,
      message: '设置更新成功'
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: '更新设置失败'
    });
  }
});

module.exports = router;
