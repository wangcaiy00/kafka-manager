/**
 * Consumer Group 路由
 */
const express = require('express');
const router = express.Router();
const KafkaService = require('../services/kafkaService');

/**
 * 获取所有 Consumer Groups
 */
router.get('/', async (req, res, next) => {
  try {
    const groups = await KafkaService.getConsumerGroups();
    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取 Consumer Group 详情
 */
router.get('/:groupId', async (req, res, next) => {
  try {
    const group = await KafkaService.getConsumerGroupDetail(req.params.groupId);
    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
