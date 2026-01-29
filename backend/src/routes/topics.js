/**
 * Topic 路由
 */
const express = require('express');
const router = express.Router();
const KafkaService = require('../services/kafkaService');

/**
 * 获取所有 Topic
 */
router.get('/', async (req, res, next) => {
  try {
    const topics = await KafkaService.getTopics();
    res.json({
      success: true,
      data: topics
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取 Topic 详情
 */
router.get('/:name', async (req, res, next) => {
  try {
    const topic = await KafkaService.getTopicDetail(req.params.name);
    res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 创建 Topic
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, partitions = 1, replicationFactor = 1 } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Topic 名称不能为空'
      });
    }

    const result = await KafkaService.createTopic(name, partitions, replicationFactor);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除 Topic
 */
router.delete('/:name', async (req, res, next) => {
  try {
    const result = await KafkaService.deleteTopic(req.params.name);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
