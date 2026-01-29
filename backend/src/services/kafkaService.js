/**
 * Kafka 服务层 - 封装所有 Kafka 操作
 */
const { Kafka, logLevel } = require('kafkajs');

class KafkaService {
  constructor() {
    this.kafka = null;
    this.admin = null;
    this.producer = null;
    this.consumers = new Map();
    this.connected = false;
  }

  /**
   * 连接到 Kafka 集群
   */
  async connect() {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: process.env.KAFKA_CLIENT_ID || 'kafka-manager',
      brokers,
      connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT) || 10000,
      requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT) || 30000,
      logLevel: logLevel.WARN,
    });

    this.admin = this.kafka.admin();
    await this.admin.connect();

    this.producer = this.kafka.producer();
    await this.producer.connect();

    this.connected = true;
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (this.producer) await this.producer.disconnect();
    if (this.admin) await this.admin.disconnect();
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
    this.connected = false;
  }

  isConnected() {
    return this.connected;
  }

  // ==================== 集群操作 ====================

  /**
   * 获取集群信息
   */
  async getClusterInfo() {
    const cluster = await this.admin.describeCluster();
    return {
      clusterId: cluster.clusterId,
      controller: cluster.controller,
      brokers: cluster.brokers.map(b => ({
        id: b.nodeId,
        host: b.host,
        port: b.port,
        isController: b.nodeId === cluster.controller
      }))
    };
  }

  /**
   * 获取集群指标
   */
  async getClusterMetrics() {
    const [cluster, topics] = await Promise.all([
      this.admin.describeCluster(),
      this.admin.listTopics()
    ]);

    const topicMetadata = await this.admin.fetchTopicMetadata({ topics });
    
    let totalPartitions = 0;
    let totalReplicas = 0;
    
    topicMetadata.topics.forEach(topic => {
      topic.partitions.forEach(partition => {
        totalPartitions++;
        totalReplicas += partition.replicas.length;
      });
    });

    return {
      timestamp: new Date().toISOString(),
      brokers: {
        total: cluster.brokers.length,
        online: cluster.brokers.length, // 在实际场景中需要健康检查
      },
      topics: {
        total: topics.length
      },
      partitions: {
        total: totalPartitions
      },
      replicas: {
        total: totalReplicas
      }
    };
  }

  // ==================== Broker 操作 ====================

  /**
   * 获取所有 Broker 信息
   */
  async getBrokers() {
    const cluster = await this.admin.describeCluster();
    const topics = await this.admin.listTopics();
    const topicMetadata = await this.admin.fetchTopicMetadata({ topics });

    // 统计每个 broker 的分区数
    const brokerPartitions = {};
    cluster.brokers.forEach(b => {
      brokerPartitions[b.nodeId] = { leader: 0, replicas: 0 };
    });

    topicMetadata.topics.forEach(topic => {
      topic.partitions.forEach(partition => {
        if (brokerPartitions[partition.leader]) {
          brokerPartitions[partition.leader].leader++;
        }
        partition.replicas.forEach(replicaId => {
          if (brokerPartitions[replicaId]) {
            brokerPartitions[replicaId].replicas++;
          }
        });
      });
    });

    return cluster.brokers.map(broker => ({
      id: broker.nodeId,
      host: broker.host,
      port: broker.port,
      isController: broker.nodeId === cluster.controller,
      status: 'online', // 实际需要健康检查
      partitions: brokerPartitions[broker.nodeId]?.leader || 0,
      replicas: brokerPartitions[broker.nodeId]?.replicas || 0
    }));
  }

  // ==================== Topic 操作 ====================

  /**
   * 获取所有 Topic
   */
  async getTopics() {
    const topics = await this.admin.listTopics();
    const metadata = await this.admin.fetchTopicMetadata({ topics });

    return Promise.all(metadata.topics.map(async (topic) => {
      const offsets = await this.admin.fetchTopicOffsets(topic.name);
      
      let messageCount = 0;
      offsets.forEach(o => {
        messageCount += parseInt(o.high) - parseInt(o.low);
      });

      return {
        name: topic.name,
        partitions: topic.partitions.length,
        replicationFactor: topic.partitions[0]?.replicas.length || 0,
        messageCount,
        status: this.getTopicStatus(topic)
      };
    }));
  }

  /**
   * 获取 Topic 详情
   */
  async getTopicDetail(topicName) {
    const metadata = await this.admin.fetchTopicMetadata({ topics: [topicName] });
    const topic = metadata.topics[0];
    
    if (!topic) {
      throw new Error(`Topic ${topicName} 不存在`);
    }

    const offsets = await this.admin.fetchTopicOffsets(topicName);
    const offsetMap = {};
    offsets.forEach(o => {
      offsetMap[o.partition] = { low: o.low, high: o.high };
    });

    return {
      name: topic.name,
      partitions: topic.partitions.map(p => ({
        id: p.partitionId,
        leader: p.leader,
        replicas: p.replicas,
        isr: p.isr,
        offsetLow: offsetMap[p.partitionId]?.low || '0',
        offsetHigh: offsetMap[p.partitionId]?.high || '0',
        messageCount: parseInt(offsetMap[p.partitionId]?.high || 0) - parseInt(offsetMap[p.partitionId]?.low || 0)
      })),
      replicationFactor: topic.partitions[0]?.replicas.length || 0,
      status: this.getTopicStatus(topic)
    };
  }

  /**
   * 创建 Topic
   */
  async createTopic(topicName, numPartitions = 1, replicationFactor = 1) {
    await this.admin.createTopics({
      topics: [{
        topic: topicName,
        numPartitions,
        replicationFactor
      }]
    });
    return { success: true, message: `Topic ${topicName} 创建成功` };
  }

  /**
   * 删除 Topic
   */
  async deleteTopic(topicName) {
    await this.admin.deleteTopics({ topics: [topicName] });
    return { success: true, message: `Topic ${topicName} 删除成功` };
  }

  getTopicStatus(topic) {
    for (const partition of topic.partitions) {
      if (partition.leader === -1) return 'offline';
      if (partition.isr.length < partition.replicas.length) return 'warning';
    }
    return 'healthy';
  }

  // ==================== Consumer Group 操作 ====================

  /**
   * 获取所有 Consumer Groups
   */
  async getConsumerGroups() {
    const groups = await this.admin.listGroups();
    
    return Promise.all(groups.groups.map(async (group) => {
      try {
        const description = await this.admin.describeGroups([group.groupId]);
        const groupDesc = description.groups[0];
        
        let totalLag = 0;
        const offsets = await this.admin.fetchOffsets({ groupId: group.groupId });
        
        for (const topicOffset of offsets) {
          try {
            const topicOffsets = await this.admin.fetchTopicOffsets(topicOffset.topic);
            topicOffset.partitions.forEach(p => {
              const topicPartition = topicOffsets.find(to => to.partition === p.partition);
              if (topicPartition && p.offset !== '-1') {
                totalLag += parseInt(topicPartition.high) - parseInt(p.offset);
              }
            });
          } catch (e) {
            // Topic 可能已被删除
          }
        }

        return {
          groupId: group.groupId,
          protocol: group.protocolType,
          state: groupDesc.state,
          members: groupDesc.members.length,
          lag: totalLag,
          coordinator: groupDesc.coordinator
        };
      } catch (error) {
        return {
          groupId: group.groupId,
          protocol: group.protocolType,
          state: 'Unknown',
          members: 0,
          lag: 0
        };
      }
    }));
  }

  /**
   * 获取 Consumer Group 详情
   */
  async getConsumerGroupDetail(groupId) {
    const description = await this.admin.describeGroups([groupId]);
    const group = description.groups[0];
    const offsets = await this.admin.fetchOffsets({ groupId });

    const members = await Promise.all(group.members.map(async (member) => {
      const assignment = member.memberAssignment;
      // 解析 member assignment 获取分配的 topic-partitions
      return {
        memberId: member.memberId,
        clientId: member.clientId,
        clientHost: member.clientHost,
        // assignment 需要解析二进制格式
      };
    }));

    // 计算每个 topic-partition 的 lag
    const topicLags = [];
    for (const topicOffset of offsets) {
      try {
        const topicOffsets = await this.admin.fetchTopicOffsets(topicOffset.topic);
        const partitionLags = topicOffset.partitions.map(p => {
          const topicPartition = topicOffsets.find(to => to.partition === p.partition);
          const currentOffset = p.offset === '-1' ? 0 : parseInt(p.offset);
          const endOffset = topicPartition ? parseInt(topicPartition.high) : 0;
          return {
            partition: p.partition,
            currentOffset,
            endOffset,
            lag: Math.max(0, endOffset - currentOffset)
          };
        });

        topicLags.push({
          topic: topicOffset.topic,
          partitions: partitionLags,
          totalLag: partitionLags.reduce((sum, p) => sum + p.lag, 0)
        });
      } catch (e) {
        // Topic 可能已被删除
      }
    }

    return {
      groupId: group.groupId,
      state: group.state,
      protocol: group.protocol,
      protocolType: group.protocolType,
      members,
      topics: topicLags
    };
  }

  // ==================== 消息操作 ====================

  /**
   * 获取消息
   */
  async getMessages(topic, partition = 0, offset = 'earliest', limit = 100) {
    const consumer = this.kafka.consumer({ 
      groupId: `kafka-manager-reader-${Date.now()}` 
    });
    
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: offset === 'earliest' });

    const messages = [];
    
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(async () => {
        await consumer.disconnect();
        resolve(messages);
      }, 5000);

      try {
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            messages.push({
              topic,
              partition,
              offset: message.offset,
              timestamp: message.timestamp,
              key: message.key?.toString() || null,
              value: message.value?.toString() || null,
              headers: Object.fromEntries(
                Object.entries(message.headers || {}).map(([k, v]) => [k, v?.toString()])
              )
            });

            if (messages.length >= limit) {
              clearTimeout(timeout);
              await consumer.disconnect();
              resolve(messages);
            }
          }
        });
      } catch (error) {
        clearTimeout(timeout);
        await consumer.disconnect();
        reject(error);
      }
    });
  }

  /**
   * 发送消息
   */
  async sendMessage(topic, messages) {
    const kafkaMessages = messages.map(msg => ({
      key: msg.key || null,
      value: typeof msg.value === 'object' ? JSON.stringify(msg.value) : msg.value,
      headers: msg.headers || {}
    }));

    const result = await this.producer.send({
      topic,
      messages: kafkaMessages
    });

    return {
      success: true,
      results: result
    };
  }

  /**
   * 批量发送消息（用于模拟器）
   */
  async sendBatchMessages(topic, count, template) {
    const messages = [];
    for (let i = 0; i < count; i++) {
      const message = {
        key: template.keyPrefix ? `${template.keyPrefix}-${i}` : null,
        value: JSON.stringify({
          ...template.value,
          index: i,
          timestamp: new Date().toISOString()
        })
      };
      messages.push(message);
    }

    return this.sendMessage(topic, messages);
  }
}

module.exports = new KafkaService();
