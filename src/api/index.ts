import { USE_MOCK } from './config';
import * as mockApi from './mockApi';
import * as realApi from './realApi';
import type { Partition, Consumer, Topic, Broker, ConsumerGroup, TopicDetail } from '@/types/kafka';

// 导出所有类型
export * from '@/types/kafka';

// ----------------------------------------------------------------------
// Auth API
// ----------------------------------------------------------------------
export const authApi = USE_MOCK ? mockApi.authApi : {
  login: realApi.login,
  logout: realApi.logout,
  updateProfile: async (userId: string, data: any) => {
    try {
      const user = await realApi.updateProfile(data);
      return { success: true, user };
    } catch (e) {
      return { success: false, error: (e as Error).message };
    }
  },
  changePassword: async (userId: string, current: string, newPass: string) => {
     try {
       await realApi.changePassword(current, newPass);
       return { success: true };
     } catch (e) {
       return { success: false, error: (e as Error).message };
     }
  }
};

// ----------------------------------------------------------------------
// Cluster API
// ----------------------------------------------------------------------
export const clusterApi = USE_MOCK ? mockApi.clusterApi : {
  getClusters: mockApi.clusterApi.getClusters, 
  getClusterStats: async (clusterId: string) => {
    try {
      const metrics = await realApi.getClusterMetrics();
      // @ts-ignore
      const brokers = metrics.brokers || { total: 0, online: 0 };
      // @ts-ignore
      const topics = metrics.topics || { total: 0 };
      // @ts-ignore
      const partitions = metrics.partitions || { total: 0 };

      return {
        clusterId,
        totalBrokers: brokers.total,
        onlineBrokers: brokers.online,
        totalTopics: topics.total,
        totalPartitions: partitions.total,
        totalConsumerGroups: 0, 
        messagesPerSec: 0,
        bytesInPerSec: 0,
        bytesOutPerSec: 0,
        totalMessages: 0,
        underReplicatedPartitions: 0,
        offlinePartitions: 0,
      };
    } catch (e) {
      console.error('Error fetching cluster stats:', e);
      // Fallback to avoid crash
      return {
        clusterId,
        totalBrokers: 0,
        onlineBrokers: 0,
        totalTopics: 0,
        totalPartitions: 0,
        totalConsumerGroups: 0,
        messagesPerSec: 0,
        bytesInPerSec: 0,
        bytesOutPerSec: 0,
        totalMessages: 0,
        underReplicatedPartitions: 0,
        offlinePartitions: 0,
      };
    }
  }
};

// ----------------------------------------------------------------------
// Broker API
// ----------------------------------------------------------------------
export const brokerApi = USE_MOCK ? mockApi.brokerApi : {
  getBrokers: realApi.getBrokers,
  getBrokerDetail: async (id: number) => {
      try {
          return await realApi.getBrokerDetail(id);
      } catch {
          return null;
      }
  }
};

// ----------------------------------------------------------------------
// Topic API
// ----------------------------------------------------------------------
export const topicApi = USE_MOCK ? mockApi.topicApi : {
  getTopics: realApi.getTopics,
  getTopicDetail: async (name: string) => {
      try {
          // @ts-ignore
          return await realApi.getTopicDetail(name);
      } catch {
          return null;
      }
  },
  getTopicPartitions: async (name: string): Promise<Partition[]> => {
      try {
          const detail = await realApi.getTopicDetail(name);
          // @ts-ignore
          return (detail.partitions || []).map((p: any) => ({
              id: p.id,
              leader: p.leader,
              replicas: p.replicas,
              isr: p.isr,
              messages: p.messageCount,
              startOffset: parseInt(p.offsetLow || '0'),
              endOffset: parseInt(p.offsetHigh || '0')
          }));
      } catch (e) {
          console.error(e);
          return [];
      }
  },
  createTopic: async (name: string, partitions: number, replicas: number) => {
      try {
          await realApi.createTopic(name, partitions, replicas);
          // @ts-ignore
          return { success: true, topic: { name, partitions, replicas } };
      } catch (e) {
          return { success: false, error: (e as Error).message };
      }
  },
  deleteTopic: async (name: string) => {
      try {
          await realApi.deleteTopic(name);
          return { success: true };
      } catch (e) {
          return { success: false, error: (e as Error).message };
      }
  }
};

// ----------------------------------------------------------------------
// Consumer Group API
// ----------------------------------------------------------------------
export const consumerGroupApi = USE_MOCK ? mockApi.consumerGroupApi : {
  getConsumerGroups: async () => {
      try {
        const groups = await realApi.getConsumerGroups();
        return groups.map((g: any) => ({
            name: g.groupId,
            state: g.state,
            members: g.members,
            topics: [], 
            lag: g.lag,
            coordinator: g.coordinator
        }));
      } catch (e) {
        console.error(e);
        return [];
      }
  },
  getConsumerGroupDetail: async (groupId: string) => {
      try {
        const detail = await realApi.getConsumerGroupDetail(groupId);
        // @ts-ignore
        const group: ConsumerGroup = {
            name: detail.groupId,
            // @ts-ignore
            state: detail.state,
            // @ts-ignore
            members: detail.members.length,
            // @ts-ignore
            topics: (detail.topics || []).map((t: any) => t.topic),
            // @ts-ignore
            lag: (detail.topics || []).reduce((sum: number, t: any) => sum + t.totalLag, 0),
            coordinator: 0 
        };

        const consumers: Consumer[] = [];
        // @ts-ignore
        if (detail.members) {
            // @ts-ignore
            detail.members.forEach((m: any, idx: number) => {
                consumers.push({
                    id: m.memberId || `consumer-${idx}`,
                    clientId: m.clientId,
                    host: m.clientHost,
                    topic: 'unknown',
                    partition: 0,
                    currentOffset: 0,
                    logEndOffset: 0,
                    lag: 0
                });
            });
        }
        
        return { group, consumers };
      } catch (e) {
          console.error(e);
          return { group: null, consumers: [] };
      }
  },
  getConsumers: async () => [] 
};

// ----------------------------------------------------------------------
// Message API
// ----------------------------------------------------------------------
export const messageApi = USE_MOCK ? mockApi.messageApi : {
  getMessages: async (topic: string, partition: number, offset?: number, limit: number = 20) => {
      try {
        return await realApi.getMessages(topic, partition, offset?.toString(), limit);
      } catch (e) {
        console.error(e);
        return [];
      }
  },
  produceMessage: async (topic: string, message: any) => {
      // @ts-ignore
      await realApi.sendMessage(topic, [{
          key: message.key,
          value: message.value,
          headers: message.headers
      }]);
      // @ts-ignore
      return { status: 'sent', timestamp: new Date().toISOString() };
  },
  consumeMessages: mockApi.messageApi.consumeMessages
};

// ----------------------------------------------------------------------
// Other APIs (Fallback to Mock)
// ----------------------------------------------------------------------
export const chartApi = mockApi.chartApi;
export const notificationApi = mockApi.notificationApi;
export const templateApi = mockApi.templateApi;
