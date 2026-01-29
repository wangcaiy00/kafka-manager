/**
 * WebSocket 服务 - 实时数据推送
 */
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebSocketServer {
  constructor(port) {
    this.port = port;
    this.wss = null;
    this.clients = new Map();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws, req) => {
      const clientId = uuidv4();
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        connectedAt: new Date()
      });

      console.log(`WebSocket 客户端连接: ${clientId}`);

      // 发送欢迎消息
      this.send(clientId, 'connected', { 
        clientId, 
        message: '连接成功',
        timestamp: new Date().toISOString()
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('消息解析错误:', error);
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket 客户端断开: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket 错误 (${clientId}):`, error);
        this.clients.delete(clientId);
      });
    });

    console.log(`WebSocket 服务器启动在端口 ${this.port}`);
  }

  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'subscribe':
        // 订阅特定频道
        if (message.channel) {
          client.subscriptions.add(message.channel);
          this.send(clientId, 'subscribed', { channel: message.channel });
        }
        break;

      case 'unsubscribe':
        // 取消订阅
        if (message.channel) {
          client.subscriptions.delete(message.channel);
          this.send(clientId, 'unsubscribed', { channel: message.channel });
        }
        break;

      case 'ping':
        // 心跳响应
        this.send(clientId, 'pong', { timestamp: new Date().toISOString() });
        break;

      default:
        console.log(`未知消息类型: ${message.type}`);
    }
  }

  /**
   * 发送消息给特定客户端
   */
  send(clientId, type, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({ type, data, timestamp: new Date().toISOString() }));
    }
  }

  /**
   * 广播消息给所有客户端
   */
  broadcast(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  /**
   * 广播消息给订阅了特定频道的客户端
   */
  broadcastToChannel(channel, type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN && client.subscriptions.has(channel)) {
        client.ws.send(message);
      }
    });
  }

  /**
   * 获取连接统计
   */
  getStats() {
    return {
      totalConnections: this.clients.size,
      clients: Array.from(this.clients.entries()).map(([id, client]) => ({
        id,
        connectedAt: client.connectedAt,
        subscriptions: Array.from(client.subscriptions)
      }))
    };
  }
}

module.exports = WebSocketServer;
