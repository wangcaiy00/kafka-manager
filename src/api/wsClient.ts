/**
 * WebSocket 客户端 - 实时数据订阅
 */
import { WS_URL } from './config';

type MessageHandler = (data: unknown) => void;

interface WsMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private pingInterval: number | null = null;
  private isConnecting = false;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * 连接 WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket 连接成功');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WsMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('WebSocket 消息解析错误:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket 错误:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = () => {
          console.log('WebSocket 连接关闭');
          this.isConnecting = false;
          this.stopPing();
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 发送消息
   */
  send(type: string, data?: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  /**
   * 订阅频道
   */
  subscribe(channel: string, handler: MessageHandler) {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    // 发送订阅请求
    this.send('subscribe', { channel });

    // 返回取消订阅函数
    return () => {
      this.unsubscribe(channel, handler);
    };
  }

  /**
   * 取消订阅
   */
  unsubscribe(channel: string, handler: MessageHandler) {
    const handlers = this.handlers.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(channel);
        this.send('unsubscribe', { channel });
      }
    }
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(message: WsMessage) {
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message.data);
        } catch (error) {
          console.error('消息处理错误:', error);
        }
      });
    }

    // 全局消息处理器
    const globalHandlers = this.handlers.get('*');
    if (globalHandlers) {
      globalHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error('全局消息处理错误:', error);
        }
      });
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket 重连次数已达上限');
      return;
    }

    this.reconnectAttempts++;
    console.log(`WebSocket 尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * 开始心跳
   */
  private startPing() {
    this.pingInterval = window.setInterval(() => {
      this.send('ping');
    }, 30000);
  }

  /**
   * 停止心跳
   */
  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// 导出单例
export const wsClient = new WebSocketClient(WS_URL);
export default wsClient;
