/**
 * Mock API 层 - 模拟后端接口
 * 所有数据交互通过此文件进行，方便后续替换为真实 API
 */

import type { 
  Broker, 
  Topic, 
  ConsumerGroup, 
  Consumer, 
  Message, 
  ChartDataPoint, 
  Partition, 
  User, 
  Notification, 
  Cluster,
  ProducerMessage,
  ConsumeRecord
} from '@/types/kafka';

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 随机波动
const fluctuate = (value: number, percent: number = 10) => {
  const change = value * (percent / 100) * (Math.random() - 0.5) * 2;
  return Math.round(value + change);
};

// 生成随机 ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ========== 数据存储 (模拟数据库) ==========
let brokersData: Broker[] = [
  { id: 1, host: '192.168.1.101', port: 9092, status: 'online', partitions: 128, bytesIn: 125600, bytesOut: 89400, version: '3.6.0', rack: 'rack-1' },
  { id: 2, host: '192.168.1.102', port: 9092, status: 'online', partitions: 135, bytesIn: 118200, bytesOut: 92100, version: '3.6.0', rack: 'rack-2' },
  { id: 3, host: '192.168.1.103', port: 9092, status: 'online', partitions: 121, bytesIn: 132800, bytesOut: 87600, version: '3.6.0', rack: 'rack-1' },
  { id: 4, host: '192.168.1.104', port: 9092, status: 'offline', partitions: 0, bytesIn: 0, bytesOut: 0, version: '3.6.0', rack: 'rack-2' },
];

let topicsData: Topic[] = [
  { name: 'user-events', partitions: 12, replicas: 3, messages: 1584326, size: '2.4 GB', status: 'healthy', retentionMs: 604800000, cleanupPolicy: 'delete' },
  { name: 'order-transactions', partitions: 8, replicas: 3, messages: 892451, size: '1.8 GB', status: 'healthy', retentionMs: 604800000, cleanupPolicy: 'delete' },
  { name: 'payment-logs', partitions: 6, replicas: 2, messages: 456123, size: '890 MB', status: 'healthy', retentionMs: 2592000000, cleanupPolicy: 'delete' },
  { name: 'inventory-updates', partitions: 4, replicas: 2, messages: 234567, size: '456 MB', status: 'warning', retentionMs: 86400000, cleanupPolicy: 'compact' },
  { name: 'notification-queue', partitions: 8, replicas: 3, messages: 678901, size: '1.2 GB', status: 'healthy', retentionMs: 259200000, cleanupPolicy: 'delete' },
  { name: 'analytics-stream', partitions: 16, replicas: 3, messages: 2345678, size: '4.5 GB', status: 'healthy', retentionMs: 604800000, cleanupPolicy: 'delete' },
  { name: 'audit-logs', partitions: 4, replicas: 2, messages: 123456, size: '234 MB', status: 'healthy', retentionMs: 7776000000, cleanupPolicy: 'delete' },
  { name: 'session-events', partitions: 6, replicas: 2, messages: 567890, size: '980 MB', status: 'error', retentionMs: 86400000, cleanupPolicy: 'delete' },
  { name: 'clickstream', partitions: 24, replicas: 3, messages: 8901234, size: '12.3 GB', status: 'healthy', retentionMs: 259200000, cleanupPolicy: 'delete' },
  { name: 'error-logs', partitions: 2, replicas: 2, messages: 34567, size: '67 MB', status: 'healthy', retentionMs: 2592000000, cleanupPolicy: 'delete' },
];

let consumerGroupsData: ConsumerGroup[] = [
  { name: 'user-service-consumer', state: 'Stable', members: 4, topics: ['user-events', 'session-events'], lag: 1234, coordinator: 1 },
  { name: 'order-processor', state: 'Stable', members: 3, topics: ['order-transactions', 'payment-logs'], lag: 567, coordinator: 2 },
  { name: 'analytics-engine', state: 'Stable', members: 6, topics: ['analytics-stream', 'clickstream'], lag: 8901, coordinator: 1 },
  { name: 'notification-sender', state: 'Rebalancing', members: 2, topics: ['notification-queue'], lag: 2345, coordinator: 3 },
  { name: 'inventory-tracker', state: 'Stable', members: 2, topics: ['inventory-updates'], lag: 123, coordinator: 2 },
  { name: 'audit-logger', state: 'Stable', members: 1, topics: ['audit-logs'], lag: 45, coordinator: 1 },
  { name: 'dead-letter-handler', state: 'Dead', members: 0, topics: ['error-logs'], lag: 9876, coordinator: 3 },
];

let consumersData: Consumer[] = [
  { id: 'consumer-1-abc123', clientId: 'user-service-1', host: '10.0.1.10', topic: 'user-events', partition: 0, currentOffset: 158420, logEndOffset: 158432, lag: 12 },
  { id: 'consumer-2-def456', clientId: 'user-service-2', host: '10.0.1.11', topic: 'user-events', partition: 1, currentOffset: 162341, logEndOffset: 162356, lag: 15 },
  { id: 'consumer-3-ghi789', clientId: 'user-service-3', host: '10.0.1.12', topic: 'user-events', partition: 2, currentOffset: 155678, logEndOffset: 155680, lag: 2 },
  { id: 'consumer-4-jkl012', clientId: 'order-processor-1', host: '10.0.2.10', topic: 'order-transactions', partition: 0, currentOffset: 89234, logEndOffset: 89240, lag: 6 },
  { id: 'consumer-5-mno345', clientId: 'order-processor-2', host: '10.0.2.11', topic: 'order-transactions', partition: 1, currentOffset: 87654, logEndOffset: 87660, lag: 6 },
];

// 预定义消息模板数据 (用于消息查看器)
const messagesTemplate: Message[] = [
  { offset: 132025, timestamp: '2024-01-15 14:32:45', key: 'user-10234', value: '{"action":"login","userId":"10234","ip":"192.168.1.45","device":"mobile"}', partition: 0, headers: { 'content-type': 'application/json' } },
  { offset: 132024, timestamp: '2024-01-15 14:32:44', key: 'user-8921', value: '{"action":"page_view","userId":"8921","page":"/products/electronics","duration":45}', partition: 0, headers: { 'content-type': 'application/json' } },
  { offset: 132023, timestamp: '2024-01-15 14:32:42', key: 'user-5672', value: '{"action":"add_to_cart","userId":"5672","productId":"SKU-9834","quantity":2}', partition: 0, headers: { 'content-type': 'application/json' } },
  { offset: 132022, timestamp: '2024-01-15 14:32:40', key: 'user-10234', value: '{"action":"search","userId":"10234","query":"wireless headphones","results":24}', partition: 0, headers: { 'content-type': 'application/json' } },
  { offset: 132021, timestamp: '2024-01-15 14:32:38', key: 'user-3456', value: '{"action":"logout","userId":"3456","sessionDuration":1823}', partition: 0, headers: { 'content-type': 'application/json' } },
  { offset: 132020, timestamp: '2024-01-15 14:32:35', key: null, value: '{"action":"system_event","type":"heartbeat","broker":1}', partition: 0, headers: { 'content-type': 'application/json', 'source': 'system' } },
  { offset: 132019, timestamp: '2024-01-15 14:32:33', key: 'user-7891', value: '{"action":"purchase","userId":"7891","orderId":"ORD-2024-78234","amount":149.99}', partition: 0, headers: { 'content-type': 'application/json' } },
  { offset: 132018, timestamp: '2024-01-15 14:32:30', key: 'user-2345', value: '{"action":"review","userId":"2345","productId":"SKU-1234","rating":5,"text":"Great product!"}', partition: 0, headers: { 'content-type': 'application/json' } },
];

// 导出消息模板用于初始数据
export const getInitialMessages = () => [...messagesTemplate];

let notificationsData: Notification[] = [
  { id: 'n1', type: 'warning', title: 'Broker 离线告警', message: 'Broker-4 (192.168.1.104) 已离线超过 5 分钟', timestamp: '2024-01-15 14:28:00', read: false },
  { id: 'n2', type: 'error', title: 'Topic 异常', message: 'Topic session-events 存在未同步副本', timestamp: '2024-01-15 14:15:00', read: false },
  { id: 'n3', type: 'warning', title: '消费延迟告警', message: 'Consumer Group dead-letter-handler 延迟超过阈值 (9876)', timestamp: '2024-01-15 14:10:00', read: false },
  { id: 'n4', type: 'info', title: '再平衡通知', message: 'Consumer Group notification-sender 正在进行再平衡', timestamp: '2024-01-15 14:05:00', read: true },
  { id: 'n5', type: 'success', title: 'Broker 恢复', message: 'Broker-3 已成功恢复在线状态', timestamp: '2024-01-15 13:45:00', read: true },
  { id: 'n6', type: 'info', title: '系统通知', message: 'Kafka 集群版本已更新至 3.6.0', timestamp: '2024-01-15 10:00:00', read: true },
];

const clustersData: Cluster[] = [
  { id: 'prod', name: '生产集群', bootstrapServers: '192.168.1.101:9092,192.168.1.102:9092,192.168.1.103:9092', status: 'connected', version: '3.6.0' },
  { id: 'staging', name: '预发布集群', bootstrapServers: '192.168.2.101:9092,192.168.2.102:9092', status: 'connected', version: '3.5.1' },
  { id: 'dev', name: '开发集群', bootstrapServers: '192.168.3.101:9092', status: 'disconnected', version: '3.4.0' },
];

const usersData: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: 'user-001',
      username: 'admin',
      email: 'admin@company.com',
      role: 'admin',
      createdAt: '2023-06-15 10:00:00',
      lastLogin: '2024-01-15 08:30:00',
    }
  },
  operator: {
    password: 'operator123',
    user: {
      id: 'user-002',
      username: 'operator',
      email: 'operator@company.com',
      role: 'operator',
      createdAt: '2023-08-20 14:30:00',
      lastLogin: '2024-01-14 09:15:00',
    }
  },
  viewer: {
    password: 'viewer123',
    user: {
      id: 'user-003',
      username: 'viewer',
      email: 'viewer@company.com',
      role: 'viewer',
      createdAt: '2023-10-10 11:00:00',
      lastLogin: '2024-01-13 16:45:00',
    }
  }
};

// ========== 认证 API ==========
export const authApi = {
  login: async (username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    await delay(800);
    const userData = usersData[username];
    if (userData && userData.password === password) {
      const user = {
        ...userData.user,
        lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      return { success: true, user };
    }
    return { success: false, error: '用户名或密码错误' };
  },

  logout: async (): Promise<{ success: boolean }> => {
    await delay(200);
    return { success: true };
  },

  updateProfile: async (userId: string, data: Partial<User>): Promise<{ success: boolean; user?: User }> => {
    await delay(500);
    const username = Object.keys(usersData).find(k => usersData[k].user.id === userId);
    if (username) {
      usersData[username].user = { ...usersData[username].user, ...data };
      return { success: true, user: usersData[username].user };
    }
    return { success: false };
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    await delay(600);
    const username = Object.keys(usersData).find(k => usersData[k].user.id === userId);
    if (username) {
      if (usersData[username].password !== currentPassword) {
        return { success: false, error: '当前密码错误' };
      }
      usersData[username].password = newPassword;
      return { success: true };
    }
    return { success: false, error: '用户不存在' };
  },
};

// ========== 集群 API ==========
export const clusterApi = {
  getClusters: async (): Promise<Cluster[]> => {
    await delay(300);
    return [...clustersData];
  },

  getClusterStats: async (clusterId: string) => {
    await delay(400);
    const onlineBrokers = brokersData.filter(b => b.status === 'online').length;
    return {
      clusterId,
      totalBrokers: brokersData.length,
      onlineBrokers,
      totalTopics: topicsData.length,
      totalPartitions: brokersData.reduce((acc, b) => acc + b.partitions, 0),
      totalConsumerGroups: consumerGroupsData.length,
      messagesPerSec: fluctuate(8542, 15),
      bytesInPerSec: fluctuate(1200000, 20),
      bytesOutPerSec: fluctuate(980000, 20),
      totalMessages: topicsData.reduce((acc, t) => acc + t.messages, 0),
      underReplicatedPartitions: Math.floor(Math.random() * 5),
      offlinePartitions: Math.floor(Math.random() * 2),
    };
  },
};

// ========== Broker API ==========
export const brokerApi = {
  getBrokers: async (): Promise<Broker[]> => {
    await delay(400);
    // 模拟数据波动
    return brokersData.map(b => ({
      ...b,
      bytesIn: b.status === 'online' ? fluctuate(b.bytesIn, 15) : 0,
      bytesOut: b.status === 'online' ? fluctuate(b.bytesOut, 15) : 0,
      partitions: b.status === 'online' ? b.partitions : 0,
    }));
  },

  getBrokerDetail: async (brokerId: number): Promise<Broker | null> => {
    await delay(300);
    const broker = brokersData.find(b => b.id === brokerId);
    return broker ? { ...broker } : null;
  },
};

// ========== Topic API ==========
export const topicApi = {
  getTopics: async (): Promise<Topic[]> => {
    await delay(400);
    return topicsData.map(t => ({
      ...t,
      messages: fluctuate(t.messages, 5),
    }));
  },

  getTopicDetail: async (topicName: string): Promise<Topic | null> => {
    await delay(300);
    const topic = topicsData.find(t => t.name === topicName);
    return topic ? { ...topic } : null;
  },

  getTopicPartitions: async (topicName: string): Promise<Partition[]> => {
    await delay(350);
    const topic = topicsData.find(t => t.name === topicName);
    if (!topic) return [];
    
    return Array.from({ length: topic.partitions }, (_, i) => {
      const leader = (i % 3) + 1;
      const replicas = [leader, ((leader) % 3) + 1, ((leader + 1) % 3) + 1];
      const messages = fluctuate(Math.floor(topic.messages / topic.partitions), 10);
      return {
        id: i,
        leader,
        replicas,
        isr: replicas,
        messages,
        startOffset: 0,
        endOffset: messages,
      };
    });
  },

  createTopic: async (name: string, partitions: number, replicas: number): Promise<{ success: boolean; topic?: Topic }> => {
    await delay(800);
    if (topicsData.find(t => t.name === name)) {
      return { success: false };
    }
    const newTopic: Topic = {
      name,
      partitions,
      replicas,
      messages: 0,
      size: '0 B',
      status: 'healthy',
      retentionMs: 604800000,
      cleanupPolicy: 'delete',
    };
    topicsData.push(newTopic);
    return { success: true, topic: newTopic };
  },

  deleteTopic: async (topicName: string): Promise<{ success: boolean }> => {
    await delay(600);
    const index = topicsData.findIndex(t => t.name === topicName);
    if (index > -1) {
      topicsData.splice(index, 1);
      return { success: true };
    }
    return { success: false };
  },
};

// ========== Consumer Group API ==========
export const consumerGroupApi = {
  getConsumerGroups: async (): Promise<ConsumerGroup[]> => {
    await delay(400);
    return consumerGroupsData.map(g => ({
      ...g,
      lag: fluctuate(g.lag, 20),
    }));
  },

  getConsumerGroupDetail: async (groupName: string): Promise<{ group: ConsumerGroup | null; consumers: Consumer[] }> => {
    await delay(350);
    const group = consumerGroupsData.find(g => g.name === groupName);
    if (!group) return { group: null, consumers: [] };
    
    const groupConsumers = consumersData.filter(c => group.topics.includes(c.topic));
    return {
      group: { ...group },
      consumers: groupConsumers.map(c => ({
        ...c,
        currentOffset: fluctuate(c.currentOffset, 1),
        logEndOffset: fluctuate(c.logEndOffset, 1),
        lag: Math.max(0, fluctuate(c.lag, 50)),
      })),
    };
  },

  getConsumers: async (): Promise<Consumer[]> => {
    await delay(300);
    return consumersData.map(c => ({
      ...c,
      lag: Math.max(0, fluctuate(c.lag, 50)),
    }));
  },
};

// ========== Message API ==========
export const messageApi = {
  getMessages: async (_topic: string, partition: number, offset?: number, limit: number = 20, _groupId?: string): Promise<Message[]> => {
    await delay(500);
    // 生成模拟消息
    const baseOffset = offset || 132025;
    const actions = ['login', 'logout', 'page_view', 'purchase', 'search', 'add_to_cart', 'review'];
    
    return Array.from({ length: limit }, (_, i) => {
      const currentOffset = baseOffset - i;
      const action = actions[Math.floor(Math.random() * actions.length)];
      const userId = Math.floor(Math.random() * 10000);
      const now = new Date();
      now.setSeconds(now.getSeconds() - i * 2);
      
      return {
        offset: currentOffset,
        timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
        key: Math.random() > 0.1 ? `user-${userId}` : null,
        value: JSON.stringify({
          action,
          userId: userId.toString(),
          timestamp: now.toISOString(),
          data: { random: Math.random() }
        }),
        partition,
        headers: { 'content-type': 'application/json' },
      };
    });
  },

  produceMessage: async (topic: string, message: { key?: string; value: string; headers?: Record<string, string>; partition?: number | 'auto' }): Promise<ProducerMessage> => {
    await delay(300);
    const success = Math.random() > 0.05;
    const partition = message.partition === 'auto' ? Math.floor(Math.random() * 12) : (message.partition || 0);
    
    return {
      id: generateId(),
      topic,
      partition,
      key: message.key || '',
      value: message.value,
      headers: message.headers || {},
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: success ? 'sent' : 'failed',
    };
  },

  consumeMessages: async (topicName: string, partition: number): Promise<ConsumeRecord> => {
    await delay(100);
    const actions = ['login', 'logout', 'page_view', 'purchase', 'search'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const userId = Math.floor(Math.random() * 10000);
    
    return {
      id: generateId(),
      topic: topicName,
      partition,
      offset: 132000 + Math.floor(Math.random() * 1000),
      key: Math.random() > 0.2 ? `user-${userId}` : null,
      value: JSON.stringify({
        action,
        userId,
        timestamp: new Date().toISOString(),
        data: { random: Math.random() },
      }),
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      headers: { 'content-type': 'application/json' },
    };
  },
};

// ========== Chart Data API ==========
export const chartApi = {
  getChartData: async (): Promise<ChartDataPoint[]> => {
    await delay(300);
    const now = new Date();
    const data: ChartDataPoint[] = [];
    
    for (let i = 20; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000);
      data.push({
        time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        messagesIn: Math.floor(Math.random() * 5000) + 1000,
        messagesOut: Math.floor(Math.random() * 4500) + 1000,
        bytesIn: Math.floor(Math.random() * 1024 * 1024 * 5),
        bytesOut: Math.floor(Math.random() * 1024 * 1024 * 4),
      });
    }
    
    return data;
  }
};

// ==================== 设置 API ====================
export const settingsApi = {
  getSettings: async (): Promise<Settings | null> => {
    await delay(200);
    const saved = localStorage.getItem('kafka_settings');
    return saved ? JSON.parse(saved) : null;
  },
  updateSettings: async (settings: Settings): Promise<void> => {
    await delay(300);
    localStorage.setItem('kafka_settings', JSON.stringify(settings));
  }
};

// ========== Notification API ==========
export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    await delay(200);
    return [...notificationsData];
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    await delay(100);
    const notification = notificationsData.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      return { success: true };
    }
    return { success: false };
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    await delay(150);
    notificationsData.forEach(n => n.read = true);
    return { success: true };
  },

  addNotification: async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<Notification> => {
    await delay(100);
    const newNotification: Notification = {
      ...notification,
      id: `n${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      read: false,
    };
    notificationsData.unshift(newNotification);
    return newNotification;
  },

  clearNotifications: async (): Promise<{ success: boolean }> => {
    await delay(100);
    notificationsData = [];
    return { success: true };
  },
};

// ========== Message Templates ==========
export const templateApi = {
  getTemplates: async () => {
    await delay(200);
    return [
      { name: '用户登录', topic: 'user-events', key: 'user-{id}', value: '{"action":"login","userId":"{id}","ip":"{ip}","timestamp":"{timestamp}"}' },
      { name: '订单创建', topic: 'order-transactions', key: 'order-{id}', value: '{"orderId":"{id}","userId":"{userId}","amount":{amount},"items":[]}' },
      { name: '库存更新', topic: 'inventory-updates', key: 'sku-{id}', value: '{"sku":"{id}","quantity":{quantity},"warehouse":"{warehouse}"}' },
      { name: '支付通知', topic: 'payment-logs', key: 'pay-{id}', value: '{"paymentId":"{id}","orderId":"{orderId}","status":"success","amount":{amount}}' },
    ];
  },
};
