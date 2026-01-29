/**
 * API 路由汇总
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const clusterRoutes = require('./cluster');
const brokerRoutes = require('./brokers');
const topicRoutes = require('./topics');
const consumerGroupRoutes = require('./consumerGroups');
const messageRoutes = require('./messages');
const settingsRoutes = require('./settings');

// 认证路由
router.use('/auth', authRoutes);

// 设置路由
router.use('/settings', settingsRoutes);

// 集群路由
router.use('/cluster', clusterRoutes);

// Broker 路由
router.use('/brokers', brokerRoutes);

// Topic 路由
router.use('/topics', topicRoutes);

// Consumer Group 路由
router.use('/consumer-groups', consumerGroupRoutes);

// 消息路由
router.use('/messages', messageRoutes);

module.exports = router;
