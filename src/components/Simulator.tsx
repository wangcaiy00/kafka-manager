import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ChevronDown,
  Clock,
  Key,
  FileText,
  Hash,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Activity
} from 'lucide-react';
import { topicApi, messageApi } from '@/api/mockApi';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/utils/cn';
import type { Topic, ProducerMessage, ConsumeRecord } from '@/types/kafka';

type SimulatorTab = 'producer' | 'consumer';

export function Simulator() {
  const { addNotification, settings } = useApp();
  const [activeTab, setActiveTab] = useState<SimulatorTab>('producer');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const compact = settings.display.compactMode;

  // 生产者状态
  const [producerForm, setProducerForm] = useState({
    topic: '',
    partition: 'auto' as number | 'auto',
    key: '',
    value: '{\n  "message": "Hello Kafka"\n}',
    headers: [{ key: 'content-type', value: 'application/json' }],
  });
  const [producedMessages, setProducedMessages] = useState<ProducerMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [batchCount, setBatchCount] = useState(1);
  const [batchInterval, setBatchInterval] = useState(100);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const batchSendingRef = useRef(false);

  // 消费者状态
  const [consumerForm, setConsumerForm] = useState({
    topic: '',
    partition: 0,
    fromOffset: 'latest' as 'latest' | 'earliest' | number,
    maxMessages: 100,
  });
  const [consumedMessages, setConsumedMessages] = useState<ConsumeRecord[]>([]);
  const [isConsuming, setIsConsuming] = useState(false);
  const [consumeSpeed, setConsumeSpeed] = useState(500);
  const consumeInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // 选中的消息
  const [selectedProducedMessage, setSelectedProducedMessage] = useState<ProducerMessage | null>(null);
  const [selectedConsumedMessage, setSelectedConsumedMessage] = useState<ConsumeRecord | null>(null);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const topicsData = await topicApi.getTopics();
        setTopics(topicsData);
        if (topicsData.length > 0) {
          setProducerForm(prev => ({ ...prev, topic: topicsData[0].name }));
          setConsumerForm(prev => ({ ...prev, topic: topicsData[0].name }));
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 生产消息
  const sendMessage = async () => {
    if (!producerForm.value.trim()) {
      addNotification({
        type: 'error',
        title: '发送失败',
        message: '消息内容不能为空',
      });
      return;
    }

    setIsSending(true);
    try {
      const result = await messageApi.produceMessage(producerForm.topic, {
        key: producerForm.key || undefined,
        value: producerForm.value,
        headers: producerForm.headers.reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {}),
        partition: producerForm.partition,
      });

      setProducedMessages(prev => [result, ...prev].slice(0, 100));

      if (result.status === 'sent') {
        addNotification({
          type: 'success',
          title: '消息发送成功',
          message: `消息已发送到 ${producerForm.topic}`,
        });
      } else {
        addNotification({
          type: 'error',
          title: '消息发送失败',
          message: '请检查 Broker 连接状态',
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  // 批量发送
  const startBatchSend = async () => {
    setIsBatchSending(true);
    batchSendingRef.current = true;
    
    for (let i = 0; i < batchCount; i++) {
      if (!batchSendingRef.current) break;
      await sendMessage();
      if (i < batchCount - 1 && batchSendingRef.current) {
        await new Promise(resolve => setTimeout(resolve, batchInterval));
      }
    }
    
    setIsBatchSending(false);
    batchSendingRef.current = false;
  };

  // 停止批量发送
  const stopBatchSend = () => {
    batchSendingRef.current = false;
    setIsBatchSending(false);
  };

  // 添加 Header
  const addHeader = () => {
    setProducerForm({
      ...producerForm,
      headers: [...producerForm.headers, { key: '', value: '' }],
    });
  };

  // 删除 Header
  const removeHeader = (index: number) => {
    setProducerForm({
      ...producerForm,
      headers: producerForm.headers.filter((_, i) => i !== index),
    });
  };

  // 模板功能已移除

  // 开始消费
  const startConsuming = () => {
    setIsConsuming(true);

    consumeInterval.current = setInterval(async () => {
      const record = await messageApi.consumeMessages(consumerForm.topic, consumerForm.partition);
      setConsumedMessages(prev => [record, ...prev].slice(0, consumerForm.maxMessages));
    }, consumeSpeed);
  };

  // 停止消费
  const stopConsuming = () => {
    setIsConsuming(false);
    if (consumeInterval.current) {
      clearInterval(consumeInterval.current);
      consumeInterval.current = null;
    }
  };

  // 清空消费记录
  const clearConsumedMessages = () => {
    setConsumedMessages([]);
    setSelectedConsumedMessage(null);
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (consumeInterval.current) {
        clearInterval(consumeInterval.current);
      }
      batchSendingRef.current = false;
    };
  }, []);

  const formatJson = (str: string) => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const currentTopic = topics.find(t => t.name === (activeTab === 'producer' ? producerForm.topic : consumerForm.topic));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Tab 切换 */}
      <div className="flex items-center gap-4 bg-white rounded-xl p-1 shadow-sm border border-slate-100 w-fit">
        <button
          onClick={() => setActiveTab('producer')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'producer'
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Send className="w-4 h-4" />
          生产者模拟器
        </button>
        <button
          onClick={() => setActiveTab('consumer')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            activeTab === 'consumer'
              ? "bg-blue-500 text-white shadow-md"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Download className="w-4 h-4" />
          消费者模拟器
        </button>
      </div>

      {/* 生产者模拟器 */}
      {activeTab === 'producer' && (
        <div className={cn("flex h-[calc(100vh-200px)]", compact ? "gap-3" : "gap-4")}>
          {/* 左侧配置区 */}
          <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-3")}>
                <h3 className="font-semibold text-slate-800">消息配置</h3>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>自定义消息</span>
                </div>
              </div>

              {/* Topic 和 Partition 选择 */}
              <div className={cn("grid grid-cols-2", compact ? "gap-2 mb-2" : "gap-3 mb-3")}>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Topic</label>
                  <div className="relative">
                    <select
                      value={producerForm.topic}
                      onChange={(e) => setProducerForm({ ...producerForm, topic: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none"
                    >
                      {topics.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">分区</label>
                  <div className="relative">
                    <select
                      value={producerForm.partition}
                      onChange={(e) => setProducerForm({ 
                        ...producerForm, 
                        partition: e.target.value === 'auto' ? 'auto' : Number(e.target.value) 
                      })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none"
                    >
                      <option value="auto">自动分配</option>
                      {currentTopic && Array.from({ length: currentTopic.partitions }, (_, i) => (
                        <option key={i} value={i}>分区 {i}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Key */}
              <div className={cn(compact ? "mb-2" : "mb-3")}>
                <label className="block text-xs text-slate-500 mb-1">消息 Key（可选）</label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={producerForm.key}
                    onChange={(e) => setProducerForm({ ...producerForm, key: e.target.value })}
                    placeholder="输入消息 Key"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Headers */}
              <div className={cn(compact ? "mb-2" : "mb-3")}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-500">Headers</label>
                  <button
                    onClick={addHeader}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    添加
                  </button>
                </div>
                <div className="space-y-2">
                  {producerForm.headers.map((header, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => {
                          const newHeaders = [...producerForm.headers];
                          newHeaders[index].key = e.target.value;
                          setProducerForm({ ...producerForm, headers: newHeaders });
                        }}
                        placeholder="Key"
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => {
                          const newHeaders = [...producerForm.headers];
                          newHeaders[index].value = e.target.value;
                          setProducerForm({ ...producerForm, headers: newHeaders });
                        }}
                        placeholder="Value"
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      />
                      <button
                        onClick={() => removeHeader(index)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 消息内容 */}
            <div className={cn("flex-1 flex flex-col", compact ? "p-3" : "p-4")}>
              <label className="block text-xs text-slate-500 mb-1">消息内容 (Value)</label>
              <textarea
                value={producerForm.value}
                onChange={(e) => setProducerForm({ ...producerForm, value: e.target.value })}
                placeholder="输入消息内容..."
                className="flex-1 w-full px-3 py-2 bg-slate-900 text-emerald-400 font-mono text-sm border border-slate-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* 发送按钮 */}
            <div className={cn("border-t border-slate-100", compact ? "p-3" : "p-4")}>
              <div className={cn("flex items-center gap-3", compact ? "mb-2" : "mb-3")}>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">批量数量:</label>
                  <input
                    type="number"
                    value={batchCount}
                    onChange={(e) => setBatchCount(Math.max(1, Number(e.target.value)))}
                    className="w-20 px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded"
                    min="1"
                    max="1000"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500">间隔(ms):</label>
                  <input
                    type="number"
                    value={batchInterval}
                    onChange={(e) => setBatchInterval(Math.max(10, Number(e.target.value)))}
                    className="w-20 px-2 py-1 text-sm bg-slate-50 border border-slate-200 rounded"
                    min="10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={sendMessage}
                  disabled={isSending || isBatchSending}
                  className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  发送消息
                </button>
                {!isBatchSending ? (
                  <button
                    onClick={startBatchSend}
                    disabled={isSending}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    批量发送
                  </button>
                ) : (
                  <button
                    onClick={stopBatchSend}
                    className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    停止
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 右侧发送记录 */}
          <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">发送记录</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">
                    成功: <span className="text-emerald-600 font-medium">{producedMessages.filter(m => m.status === 'sent').length}</span>
                  </span>
                  <span className="text-slate-500">
                    失败: <span className="text-red-600 font-medium">{producedMessages.filter(m => m.status === 'failed').length}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {producedMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">暂无发送记录</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {producedMessages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedProducedMessage(msg)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedProducedMessage?.id === msg.id ? "bg-blue-50" : "hover:bg-slate-50",
                        compact ? "p-2" : "p-3"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {msg.status === 'sent' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium text-slate-700">{msg.topic}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                            {msg.partition === 'auto' ? '自动' : `P-${msg.partition}`}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">{msg.timestamp.slice(11)}</span>
                      </div>
                      {msg.key && (
                        <div className="flex items-center gap-1 mb-1">
                          <Key className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600 font-mono">{msg.key}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 font-mono truncate">{msg.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 消费者模拟器 */}
      {activeTab === 'consumer' && (
        <div className={cn("flex h-[calc(100vh-200px)]", compact ? "gap-3" : "gap-4")}>
          {/* 左侧配置和控制 */}
          <div className={cn("w-80 flex-shrink-0 space-y-4", compact && "space-y-3")}>
            <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
              <h3 className={cn("font-semibold text-slate-800", compact ? "mb-3" : "mb-4")}>消费者配置</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Topic</label>
                  <div className="relative">
                    <select
                      value={consumerForm.topic}
                      onChange={(e) => setConsumerForm({ ...consumerForm, topic: e.target.value })}
                      disabled={isConsuming}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none disabled:opacity-50"
                    >
                      {topics.map(t => (
                        <option key={t.name} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">分区</label>
                  <div className="relative">
                    <select
                      value={consumerForm.partition}
                      onChange={(e) => setConsumerForm({ ...consumerForm, partition: Number(e.target.value) })}
                      disabled={isConsuming}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none disabled:opacity-50"
                    >
                      {currentTopic && Array.from({ length: currentTopic.partitions }, (_, i) => (
                        <option key={i} value={i}>分区 {i}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">起始位置</label>
                  <div className="relative">
                    <select
                      value={consumerForm.fromOffset}
                      onChange={(e) => setConsumerForm({ 
                        ...consumerForm, 
                        fromOffset: e.target.value as 'latest' | 'earliest'
                      })}
                      disabled={isConsuming}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none disabled:opacity-50"
                    >
                      <option value="latest">最新消息</option>
                      <option value="earliest">最早消息</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">消费速度 (ms/条)</label>
                  <input
                    type="range"
                    value={consumeSpeed}
                    onChange={(e) => setConsumeSpeed(Number(e.target.value))}
                    min="100"
                    max="2000"
                    step="100"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>快 (100ms)</span>
                    <span>{consumeSpeed}ms</span>
                    <span>慢 (2000ms)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">最大记录数</label>
                  <input
                    type="number"
                    value={consumerForm.maxMessages}
                    onChange={(e) => setConsumerForm({ ...consumerForm, maxMessages: Number(e.target.value) })}
                    disabled={isConsuming}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
                    min="10"
                    max="1000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                {!isConsuming ? (
                  <button
                    onClick={startConsuming}
                    className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    开始消费
                  </button>
                ) : (
                  <button
                    onClick={stopConsuming}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    停止消费
                  </button>
                )}
                <button
                  onClick={clearConsumedMessages}
                  disabled={isConsuming}
                  className="px-3 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 消费统计 */}
            <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
              <h3 className={cn("font-semibold text-slate-800", compact ? "mb-2" : "mb-3")}>消费统计</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">已消费消息</span>
                  <span className="text-lg font-bold text-blue-600">{consumedMessages.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">状态</span>
                  <span className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    isConsuming ? "text-emerald-600" : "text-slate-500"
                  )}>
                    {isConsuming && <Activity className="w-4 h-4 animate-pulse" />}
                    {isConsuming ? '消费中' : '已停止'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 中间消费记录列表 */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <h3 className="font-semibold text-slate-800">消费记录</h3>
            </div>
            <div className="flex-1 overflow-auto">
              {consumedMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-slate-400">
                    <Download className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">点击"开始消费"拉取消息</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {consumedMessages.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedConsumedMessage(record)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedConsumedMessage?.id === record.id ? "bg-blue-50" : "hover:bg-slate-50",
                        compact ? "p-2" : "p-3"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                            #{record.offset}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                            P-{record.partition}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          {record.timestamp.slice(11)}
                        </div>
                      </div>
                      {record.key && (
                        <div className="flex items-center gap-1 mb-1">
                          <Key className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600 font-mono">{record.key}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-500 font-mono truncate">{record.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧消息详情 */}
          <div className="w-80 flex-shrink-0 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            {selectedConsumedMessage ? (
              <>
                <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
                  <h3 className="font-semibold text-slate-800">消息详情</h3>
                </div>
                <div className={cn("border-b border-slate-100 bg-slate-50", compact ? "p-3" : "p-4")}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Offset</p>
                      <p className="text-sm font-mono text-slate-800">{selectedConsumedMessage.offset}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">分区</p>
                      <p className="text-sm text-slate-800">P-{selectedConsumedMessage.partition}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">时间戳</p>
                      <p className="text-sm text-slate-800">{selectedConsumedMessage.timestamp}</p>
                    </div>
                  </div>
                </div>
                <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-slate-700">Key</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <code className="text-sm font-mono text-slate-700">
                      {selectedConsumedMessage.key || <span className="text-slate-400 italic">null</span>}
                    </code>
                  </div>
                </div>
                <div className={cn("flex-1 overflow-auto", compact ? "p-3" : "p-4")}>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-700">Value</span>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 overflow-auto">
                    <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                      {formatJson(selectedConsumedMessage.value)}
                    </pre>
                  </div>
                </div>
                <div className={cn("border-t border-slate-100", compact ? "p-3" : "p-4")}>
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-violet-500" />
                    <span className="text-sm font-medium text-slate-700">Headers</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(selectedConsumedMessage.headers).map(([key, value]) => (
                      <span key={key} className="px-2 py-1 bg-slate-100 rounded text-xs">
                        <span className="text-slate-500">{key}:</span>
                        <span className="text-slate-700 ml-1">{value}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">选择一条消息查看详情</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
