/**
 * 消息路由
 */
const express = require('express');
const router = express.Router();
const KafkaService = require('../services/kafkaService');

/**
 * 获取消息
 */
router.get('/:topic', async (req, res, next) => {
  try {
    const { topic } = req.params;
    const { partition = 0, offset = 'earliest', limit = 100, groupId } = req.query;

    const messages = await KafkaService.getMessages(
      topic,
      parseInt(partition),
      offset,
      parseInt(limit),
      groupId
    );

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 发送消息
 */
router.post('/:topic', async (req, res, next) => {
  try {
    const { topic } = req.params;
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: '消息不能为空'
      });
    }

    const result = await KafkaService.sendMessage(topic, messages);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 批量发送消息（模拟器）
 */
router.post('/:topic/batch', async (req, res, next) => {
  try {
    const { topic } = req.params;
    const { count = 10, template = {} } = req.body;

    const result = await KafkaService.sendBatchMessages(topic, count, template);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
