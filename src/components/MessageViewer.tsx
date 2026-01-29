import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  ChevronDown, 
  Clock, 
  Key, 
  FileText, 
  RefreshCw,
  Copy,
  Download,
  ChevronLeft,
  ChevronRight,
  Hash,
  Loader2
} from 'lucide-react';
import { topicApi, messageApi } from '@/api';
import { cn } from '@/utils/cn';
import { useApp } from '@/contexts/AppContext';
import type { Topic, Message } from '@/types/kafka';

export function MessageViewer() {
  const { addNotification, settings, lastRefresh } = useApp();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedPartition, setSelectedPartition] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [offsetInput, setOffsetInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const compact = settings.display.compactMode;

  // 加载 Topics
  useEffect(() => {
    const loadTopics = async () => {
      setIsLoading(true);
      try {
        const data = await topicApi.getTopics();
        setTopics(data);
        if (data.length > 0 && !selectedTopic) {
          setSelectedTopic(data[0].name);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTopics();
  }, [lastRefresh]);

  // 加载消息
  useEffect(() => {
    if (!selectedTopic) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await messageApi.getMessages(selectedTopic, selectedPartition, undefined, 20);
        setMessages(data);
        setSelectedMessage(null);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [selectedTopic, selectedPartition]);

  const currentTopic = topics.find(t => t.name === selectedTopic);

  const formatJson = (str: string) => {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const handleRefresh = async () => {
    setLoadingMessages(true);
    try {
      const data = await messageApi.getMessages(selectedTopic, selectedPartition, undefined, 20);
      setMessages(data);
      addNotification({
        type: 'success',
        title: '刷新成功',
        message: '消息列表已更新',
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCopyValue = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.value);
      addNotification({
        type: 'success',
        title: '复制成功',
        message: '消息内容已复制到剪贴板',
      });
    }
  };

  const handleJumpToOffset = async () => {
    const offset = parseInt(offsetInput);
    if (!isNaN(offset)) {
      setLoadingMessages(true);
      try {
        const data = await messageApi.getMessages(selectedTopic, selectedPartition, offset, 20);
        setMessages(data);
        const msg = data.find(m => m.offset === offset);
        if (msg) {
          setSelectedMessage(msg);
          addNotification({
            type: 'success',
            title: '跳转成功',
            message: `已定位到 Offset ${offset}`,
          });
        } else {
          addNotification({
            type: 'info',
            title: '已加载附近消息',
            message: `Offset ${offset} 附近的消息已加载`,
          });
        }
      } finally {
        setLoadingMessages(false);
      }
    }
  };

  const handleQuickJump = async (position: 'latest' | 'earliest' | '1h' | '1d') => {
    setLoadingMessages(true);
    try {
      // 模拟不同位置的跳转
      let offset: number | undefined;
      switch (position) {
        case 'latest':
          offset = undefined; // 最新
          break;
        case 'earliest':
          offset = 0;
          break;
        case '1h':
          offset = 130000; // 模拟 1 小时前
          break;
        case '1d':
          offset = 100000; // 模拟 1 天前
          break;
      }
      const data = await messageApi.getMessages(selectedTopic, selectedPartition, offset, 20);
      setMessages(data);
      setSelectedMessage(null);
      addNotification({
        type: 'success',
        title: '跳转成功',
        message: `已跳转到${position === 'latest' ? '最新消息' : position === 'earliest' ? '最早消息' : position === '1h' ? '1 小时前' : '1 天前'}`,
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  if (isLoading && topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-[calc(100vh-140px)]", compact ? "gap-3" : "gap-4")}>
      {/* 左侧面板 - 消息列表 */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
        {/* 控制区域 */}
        <div className={cn("border-b border-slate-100 space-y-3", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            {/* Topic 选择器 */}
            <div className="flex-1">
              <label className="text-xs text-slate-500 block mb-1">Topic</label>
              <div className="relative">
                <select
                  value={selectedTopic}
                  onChange={(e) => {
                    setSelectedTopic(e.target.value);
                    setSelectedPartition(0);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {topics.map(topic => (
                    <option key={topic.name} value={topic.name}>{topic.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* 分区选择器 */}
            <div className="w-32">
              <label className="text-xs text-slate-500 block mb-1">分区</label>
              <div className="relative">
                <select
                  value={selectedPartition}
                  onChange={(e) => setSelectedPartition(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {currentTopic && Array.from({ length: currentTopic.partitions }, (_, i) => (
                    <option key={i} value={i}>分区 {i}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Offset 搜索和刷新 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="输入 Offset 跳转..."
                value={offsetInput}
                onChange={(e) => setOffsetInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJumpToOffset()}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button 
              onClick={handleJumpToOffset}
              className="px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200 transition-colors"
            >
              跳转
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loadingMessages}
              className="px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={cn('w-4 h-4', loadingMessages && 'animate-spin')} />
              刷新
            </button>
          </div>

          {/* 快速定位按钮 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">快速定位:</span>
            <button 
              onClick={() => handleQuickJump('latest')}
              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              最新消息
            </button>
            <button 
              onClick={() => handleQuickJump('earliest')}
              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              最早消息
            </button>
            <button 
              onClick={() => handleQuickJump('1h')}
              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              1 小时前
            </button>
            <button 
              onClick={() => handleQuickJump('1d')}
              className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
            >
              1 天前
            </button>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-auto">
          {loadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">暂无消息</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.offset}
                onClick={() => setSelectedMessage(message)}
                className={cn(
                  'border-b border-slate-50 cursor-pointer transition-colors',
                  selectedMessage?.offset === message.offset ? 'bg-blue-50' : 'hover:bg-slate-50',
                  compact ? 'p-2' : 'p-3'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                      #{message.offset}
                    </span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                      分区 {message.partition}
                    </span>
                  </div>
                  {settings.display.showTimestamps && (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" />
                      {message.timestamp}
                    </div>
                  )}
                </div>
                {message.key && (
                  <div className="flex items-center gap-1 mb-1">
                    <Key className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-amber-700 font-mono">{message.key}</span>
                  </div>
                )}
                <p className="text-sm text-slate-600 truncate font-mono text-xs">{message.value}</p>
              </div>
            ))
          )}
        </div>

        {/* 分页控制 */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">显示 {messages.length} 条消息</span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-400"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-600">第 {currentPage} 页</span>
            <button 
              onClick={() => setCurrentPage(p => p + 1)}
              className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-400"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 右侧面板 - 消息详情 */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
        {selectedMessage ? (
          <>
            {/* 头部 */}
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("bg-blue-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
                    <MessageSquare className={cn("text-blue-600", compact ? "w-4 h-4" : "w-5 h-5")} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">消息详情</h3>
                    <p className="text-xs text-slate-500">Offset: {selectedMessage.offset}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleCopyValue}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    复制
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    下载
                  </button>
                </div>
              </div>
            </div>

            {/* 元信息 */}
            <div className={cn("border-b border-slate-100 bg-slate-50", compact ? "p-3" : "p-4")}>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Offset</p>
                  <p className="text-sm font-mono text-slate-800">{selectedMessage.offset}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">分区</p>
                  <p className="text-sm font-mono text-slate-800">分区 {selectedMessage.partition}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">时间戳</p>
                  <p className="text-sm text-slate-800">{selectedMessage.timestamp}</p>
                </div>
              </div>
            </div>

            {/* Key */}
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-slate-700">消息 Key</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <code className="text-sm font-mono text-slate-700">
                  {selectedMessage.key || <span className="text-slate-400 italic">null (无 Key)</span>}
                </code>
              </div>
            </div>

            {/* Value */}
            <div className={cn("flex-1 overflow-auto", compact ? "p-3" : "p-4")}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-slate-700">消息内容 (Value)</span>
              </div>
              <div className="bg-slate-900 rounded-lg p-4 overflow-auto max-h-[300px]">
                <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap">
                  {formatJson(selectedMessage.value)}
                </pre>
              </div>
            </div>

            {/* Headers */}
            <div className={cn("border-t border-slate-100", compact ? "p-3" : "p-4")}>
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-slate-700">Headers</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedMessage.headers).map(([key, value]) => (
                  <span key={key} className="px-2 py-1 bg-slate-100 rounded text-xs border border-slate-200">
                    <span className="text-slate-500">{key}:</span>
                    <span className="text-slate-700 ml-1">{value}</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">请选择一条消息查看详情</p>
              <p className="text-xs mt-1">点击左侧列表中的消息</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
