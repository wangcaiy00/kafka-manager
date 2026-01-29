/**
 * Broker 路由
 */
const express = require('express');
const router = express.Router();
const KafkaService = require('../services/kafkaService');

/**
 * 获取所有 Broker
 */
router.get('/', async (req, res, next) => {
  try {
    const brokers = await KafkaService.getBrokers();
    res.json({
      success: true,
      data: brokers
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取 Broker 详情
 */
router.get('/:id', async (req, res, next) => {
  try {
    const brokers = await KafkaService.getBrokers();
    const broker = brokers.find(b => b.id === parseInt(req.params.id));
    
    if (!broker) {
      return res.status(404).json({
        success: false,
        message: `Broker ${req.params.id} 不存在`
      });
    }

    res.json({
      success: true,
      data: broker
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
