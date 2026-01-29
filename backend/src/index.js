/**
 * Kafka Manager 后端服务入口
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocketServer = require('./websocket/server');
const KafkaService = require('./services/kafkaService');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    kafka: KafkaService.isConnected() ? 'connected' : 'disconnected'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

const { initDatabase } = require('./models');

// 启动服务
async function start() {
  try {
    // 初始化数据库
    await initDatabase();

    // 连接 Kafka
    console.log('正在连接 Kafka 集群...');
    await KafkaService.connect();
    console.log('Kafka 连接成功!');

    // 启动 HTTP 服务
    server.listen(PORT, () => {
      console.log(`HTTP 服务启动在端口 ${PORT}`);
    });

    // 启动 WebSocket 服务
    const wsServer = new WebSocketServer(WS_PORT);
    wsServer.start();
    console.log(`WebSocket 服务启动在端口 ${WS_PORT}`);

    // 启动指标收集
    startMetricsCollection(wsServer);

  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

// 定时收集并推送指标
function startMetricsCollection(wsServer) {
  setInterval(async () => {
    try {
      const metrics = await KafkaService.getClusterMetrics();
      wsServer.broadcast('metrics', metrics);
    } catch (error) {
      console.error('指标收集失败:', error);
    }
  }, 5000); // 每5秒收集一次
}

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到 SIGTERM 信号，正在关闭服务...');
  await KafkaService.disconnect();
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

start();
