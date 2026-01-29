// Kafka 相关类型定义

export interface Broker {
  id: number;
  host: string;
  port: number;
  status: 'online' | 'offline';
  partitions: number;
  bytesIn: number;
  bytesOut: number;
  version?: string;
  rack?: string;
}

export interface Topic {
  name: string;
  partitions: number;
  replicas: number;
  messages: number;
  size: string;
  status: 'healthy' | 'warning' | 'error';
  retentionMs?: number;
  cleanupPolicy?: 'delete' | 'compact';
}

export interface Partition {
  id: number;
  leader: number;
  replicas: number[];
  isr: number[];
  messages: number;
  startOffset: number;
  endOffset: number;
}

export interface ConsumerGroup {
  name: string;
  state: 'Stable' | 'Rebalancing' | 'Dead' | 'Empty';
  members: number;
  topics: string[];
  lag: number;
  coordinator: number;
}

export interface Consumer {
  id: string;
  clientId: string;
  host: string;
  topic: string;
  partition: number;
  currentOffset: number;
  logEndOffset: number;
  lag: number;
}

export interface Message {
  offset: number;
  timestamp: string;
  key: string | null;
  value: string;
  partition: number;
  headers: Record<string, string>;
}

export interface ClusterMetrics {
  messagesPerSec: number;
  bytesInPerSec: number;
  bytesOutPerSec: number;
  totalMessages: number;
}

export interface ChartDataPoint {
  time: string;
  messagesIn: number;
  messagesOut: number;
  bytesIn: number;
  bytesOut: number;
}

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: string;
  lastLogin: string;
}

// 通知类型
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// 设置类型
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  refreshInterval: number;
  notifications: {
    brokerOffline: boolean;
    highLag: boolean;
    topicError: boolean;
    email: boolean;
  };
  display: {
    compactMode: boolean;
    showTimestamps: boolean;
    dateFormat: string;
  };
  security: {
    saslEnabled: boolean;
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512' | 'gssapi';
    username: string;
    password: string;
    sslEnabled: boolean;
  };
}

// 集群类型
export interface Cluster {
  id: string;
  name: string;
  bootstrapServers: string;
  status: 'connected' | 'disconnected' | 'connecting';
  version: string;
}

// 生产者消息类型
export interface ProducerMessage {
  id: string;
  topic: string;
  partition: number | 'auto';
  key: string;
  value: string;
  headers: Record<string, string>;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
}

// 消费记录类型
export interface ConsumeRecord {
  id: string;
  topic: string;
  partition: number;
  offset: number;
  key: string | null;
  value: string;
  timestamp: string;
  headers: Record<string, string>;
}
