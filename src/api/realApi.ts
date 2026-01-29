// @ts-nocheck
/**
 * 真实 API 实现 - 连接后端服务
 * 当前项目默认使用 mock API。若要对接真实后端，请完善类型定义并移除此注释。
 */
import { httpClient } from './httpClient';

// ==================== 认证 API ====================

export async function login(username: string, password: string): Promise<{ token: string; user: User }> {
  const response = await httpClient.post<{ token: string; user: User }>('/auth/login', {
    username,
    password,
  });

  if (!response.success || !response.data) {
    throw new Error(response.message || '登录失败');
  }

  // 设置 Token
  httpClient.setAuthToken(response.data.token);

  return response.data;
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
  httpClient.setAuthToken(null);
}

export async function getCurrentUser(): Promise<User> {
  const response = await httpClient.get<User>('/auth/me');
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取用户信息失败');
  }
  return response.data;
}

export async function updateProfile(data: Partial<User>): Promise<User> {
  const response = await httpClient.put<User>('/auth/me', data);
  if (!response.success || !response.data) {
    throw new Error(response.message || '更新失败');
  }
  return response.data;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const response = await httpClient.put('/auth/password', { oldPassword, newPassword });
  if (!response.success) {
    throw new Error(response.message || '修改密码失败');
  }
}

// ==================== 集群 API ====================

export async function getClusters(): Promise<Cluster[]> {
  const response = await httpClient.get<any>('/cluster/info');
  if (!response.success || !response.data) {
    // If fail, return empty or throw? 
    // For now, let's return a default one if connected, or empty.
    // Actually, let's just return what we have formatted as a list.
    throw new Error(response.message || '获取集群信息失败');
  }
  
  // The backend returns a single cluster info object. We wrap it in an array.
  const info = response.data;
  return [{
    id: 'prod', // Default ID as backend might not return one suitable for frontend ID
    name: 'Production Cluster',
    brokers: info.brokers || 0,
    topics: info.topics || 0,
    partitions: info.partitions || 0,
    version: info.version || '3.0.0',
    status: 'online' // Assume online if we got a response
  }];
}

export async function getClusterMetrics(): Promise<DashboardMetrics> {
  const response = await httpClient.get<DashboardMetrics>('/cluster/metrics');
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取集群指标失败');
  }
  return response.data;
}

export async function getClusterHealth(): Promise<{ connected: boolean }> {
  const response = await httpClient.get<{ connected: boolean }>('/cluster/health');
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取健康状态失败');
  }
  return response.data;
}

// ==================== 设置 API ====================

export async function getSettings(): Promise<Settings | null> {
  const response = await httpClient.get<Record<string, any>>('/settings');
  if (!response.success || !response.data) {
    return null;
  }
  return response.data.app_settings || null;
}

export async function updateSettings(settings: Settings): Promise<void> {
  const response = await httpClient.post('/settings', { app_settings: settings });
  if (!response.success) {
    throw new Error(response.message || '保存设置失败');
  }
}

// ==================== Broker API ====================

export async function getBrokers(): Promise<Broker[]> {
  const response = await httpClient.get<Broker[]>('/brokers');
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取 Broker 列表失败');
  }
  return response.data;
}

export async function getBrokerDetail(id: number): Promise<Broker> {
  const response = await httpClient.get<Broker>(`/brokers/${id}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取 Broker 详情失败');
  }
  return response.data;
}

// ==================== Topic API ====================

export async function getTopics(): Promise<Topic[]> {
  const response = await httpClient.get<Topic[]>('/topics');
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取 Topic 列表失败');
  }
  return response.data;
}

export async function getTopicDetail(name: string): Promise<TopicDetail> {
  const response = await httpClient.get<TopicDetail>(`/topics/${encodeURIComponent(name)}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取 Topic 详情失败');
  }
  return response.data;
}

export async function createTopic(
  name: string, 
  partitions: number, 
  replicationFactor: number
): Promise<void> {
  const response = await httpClient.post('/topics', { name, partitions, replicationFactor });
  if (!response.success) {
    throw new Error(response.message || '创建 Topic 失败');
  }
}

export async function deleteTopic(name: string): Promise<void> {
  const response = await httpClient.delete(`/topics/${encodeURIComponent(name)}`);
  if (!response.success) {
    throw new Error(response.message || '删除 Topic 失败');
  }
}

// ==================== Consumer Group API ====================

export async function getConsumerGroups(): Promise<ConsumerGroup[]> {
  const response = await httpClient.get<ConsumerGroup[]>('/consumer-groups');
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取 Consumer Group 列表失败');
  }
  return response.data;
}

export async function getConsumerGroupDetail(groupId: string): Promise<ConsumerGroup> {
  const response = await httpClient.get<ConsumerGroup>(`/consumer-groups/${encodeURIComponent(groupId)}`);
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取 Consumer Group 详情失败');
  }
  return response.data;
}

// ==================== 消息 API ====================

export async function getMessages(
  topic: string, 
  partition: number = 0, 
  offset: string = 'earliest',
  limit: number = 100,
  groupId?: string
): Promise<Message[]> {
  const params = new URLSearchParams({
    partition: partition.toString(),
    offset,
    limit: limit.toString(),
  });
  
  if (groupId) {
    params.append('groupId', groupId);
  }
  
  const response = await httpClient.get<Message[]>(
    `/messages/${encodeURIComponent(topic)}?${params}`
  );
  
  if (!response.success || !response.data) {
    throw new Error(response.message || '获取消息失败');
  }
  return response.data;
}

export async function sendMessage(
  topic: string, 
  messages: Array<{ key?: string; value: string; headers?: Record<string, string> }>
): Promise<void> {
  const response = await httpClient.post(`/messages/${encodeURIComponent(topic)}`, { messages });
  if (!response.success) {
    throw new Error(response.message || '发送消息失败');
  }
}

export async function sendBatchMessages(
  topic: string, 
  count: number, 
  template: { keyPrefix?: string; value: Record<string, unknown> }
): Promise<void> {
  const response = await httpClient.post(`/messages/${encodeURIComponent(topic)}/batch`, {
    count,
    template,
  });
  if (!response.success) {
    throw new Error(response.message || '批量发送消息失败');
  }
}
