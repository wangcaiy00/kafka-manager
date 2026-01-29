/**
 * 集群路由
 */
const express = require('express');
const router = express.Router();
const KafkaService = require('../services/kafkaService');

/**
 * 获取集群信息
 */
router.get('/info', async (req, res, next) => {
  try {
    const info = await KafkaService.getClusterInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取集群指标
 */
router.get('/metrics', async (req, res, next) => {
  try {
    const metrics = await KafkaService.getClusterMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 健康检查
 */
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    data: {
      connected: KafkaService.isConnected(),
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
