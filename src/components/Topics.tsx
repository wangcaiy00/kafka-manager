import { useState, useEffect } from 'react';
import { 
  FolderTree, 
  Search, 
  ChevronRight, 
  Database, 
  Copy, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Trash2,
  Settings,
  Clock,
  Loader2
} from 'lucide-react';
import { topicApi } from '@/api';
import { cn } from '@/utils/cn';
import { useApp } from '@/contexts/AppContext';
import type { Topic, Partition } from '@/types/kafka';

export function Topics() {
  const { lastRefresh, settings, addNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'warning' | 'error'>('all');
  const [loadingPartitions, setLoadingPartitions] = useState(false);
  
  // 新建 Topic 状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    partitions: 1,
    replicas: 1
  });
  const [isCreating, setIsCreating] = useState(false);

  const compact = settings.display.compactMode;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await topicApi.getTopics();
        setTopics(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lastRefresh]);

  // 加载分区信息
  useEffect(() => {
    if (!selectedTopic) {
      setPartitions([]);
      return;
    }

    const loadPartitions = async () => {
      setLoadingPartitions(true);
      try {
        const data = await topicApi.getTopicPartitions(selectedTopic.name);
        setPartitions(data);
      } finally {
        setLoadingPartitions(false);
      }
    };
    loadPartitions();
  }, [selectedTopic]);

  const filteredTopics = topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || topic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: Topic['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: Topic['status']) => {
    const classes = {
      healthy: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      error: 'bg-red-100 text-red-700 border-red-200',
    };
    const labels = {
      healthy: '健康',
      warning: '警告',
      error: '异常',
    };
    return (
      <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', classes[status])}>
        {labels[status]}
      </span>
    );
  };

  const formatRetention = (ms: number | undefined) => {
    if (!ms) return '-';
    const days = Math.floor(ms / 86400000);
    if (days > 0) return `${days} 天`;
    const hours = Math.floor(ms / 3600000);
    return `${hours} 小时`;
  };

  const handleCopyName = () => {
    if (selectedTopic) {
      navigator.clipboard.writeText(selectedTopic.name);
      addNotification({
        type: 'success',
        title: '复制成功',
        message: `Topic 名称 "${selectedTopic.name}" 已复制到剪贴板`,
      });
    }
  };

  const handleCreateTopic = async () => {
    if (!createForm.name) {
      addNotification({
        type: 'error',
        title: '验证失败',
        message: '请输入 Topic 名称',
      });
      return;
    }

    setIsCreating(true);
    try {
      const result = await topicApi.createTopic(
        createForm.name,
        createForm.partitions,
        createForm.replicas
      );

      // @ts-ignore
      if (result.success) {
        addNotification({
          type: 'success',
          title: '创建成功',
          message: `Topic "${createForm.name}" 创建成功`,
        });
        setIsCreateModalOpen(false);
        setCreateForm({
          name: '',
          partitions: 1,
          replicas: 1
        });
        
        // Refresh list
        setLoading(true);
        try {
          const data = await topicApi.getTopics();
          setTopics(data);
        } finally {
          setLoading(false);
        }

      } else {
        addNotification({
          type: 'error',
          title: '创建失败',
          // @ts-ignore
          message: result.error || '未知错误',
        });
      }
    } catch (e) {
      addNotification({
        type: 'error',
        title: '创建失败',
        message: (e as Error).message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const statusCounts = {
    all: topics.length,
    healthy: topics.filter(t => t.status === 'healthy').length,
    warning: topics.filter(t => t.status === 'warning').length,
    error: topics.filter(t => t.status === 'error').length,
  };

  if (loading && topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("flex h-[calc(100vh-140px)]", compact ? "gap-3" : "gap-4")}>
      {/* 左侧 Topics 列表 */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
        <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
          <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-3")}>
            <h3 className="font-semibold text-slate-800">Topics 列表 ({filteredTopics.length})</h3>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              新建 Topic
            </button>
          </div>

          {/* 搜索框 */}
          <div className={cn("relative", compact ? "mb-2" : "mb-3")}>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索 Topic 名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            {(['all', 'healthy', 'warning', 'error'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1 text-xs rounded-full transition-colors",
                  statusFilter === status
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {status === 'all' ? '全部' : status === 'healthy' ? '健康' : status === 'warning' ? '警告' : '异常'}
                <span className="ml-1">({statusCounts[status]})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic 列表 */}
        <div className="flex-1 overflow-auto">
          {filteredTopics.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">未找到匹配的 Topic</p>
              </div>
            </div>
          ) : (
            filteredTopics.map((topic) => (
              <div
                key={topic.name}
                onClick={() => setSelectedTopic(topic)}
                className={cn(
                  'border-b border-slate-50 cursor-pointer transition-colors',
                  selectedTopic?.name === topic.name ? 'bg-blue-50' : 'hover:bg-slate-50',
                  compact ? 'p-2' : 'p-3'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderTree className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-slate-800 text-sm">{topic.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(topic.status)}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 ml-6">
                  <span className="text-xs text-slate-500">
                    <span className="text-slate-400">分区:</span> {topic.partitions}
                  </span>
                  <span className="text-xs text-slate-500">
                    <span className="text-slate-400">副本:</span> {topic.replicas}
                  </span>
                  <span className="text-xs text-slate-500">
                    <span className="text-slate-400">大小:</span> {topic.size}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧 Topic 详情 */}
      <div className="w-1/2 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
        {selectedTopic ? (
          <>
            {/* 头部信息 */}
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("bg-blue-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
                    <FolderTree className={cn("text-blue-600", compact ? "w-4 h-4" : "w-5 h-5")} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{selectedTopic.name}</h3>
                      <button 
                        onClick={handleCopyName}
                        className="p-1 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="复制名称"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Topic 详细信息</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTopic.status)}
                  <button 
                    onClick={() => console.log('打开 Topic 设置', selectedTopic?.name)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" 
                    title="设置"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                  </button>
                  <button 
                    onClick={() => {
                      if (selectedTopic && confirm(`确定要删除 Topic "${selectedTopic.name}" 吗？`)) {
                        console.log('删除 Topic', selectedTopic.name);
                        addNotification({
                          type: 'success',
                          title: '删除成功',
                          message: `Topic "${selectedTopic.name}" 已删除`,
                        });
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500 cursor-pointer" 
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 统计信息 */}
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <div className={cn("grid grid-cols-4", compact ? "gap-2" : "gap-3")}>
                <div className={cn("bg-slate-50 rounded-lg", compact ? "p-2" : "p-3")}>
                  <p className="text-xs text-slate-500 mb-1">分区数</p>
                  <p className={cn("font-bold text-slate-800", compact ? "text-base" : "text-lg")}>{selectedTopic.partitions}</p>
                </div>
                <div className={cn("bg-slate-50 rounded-lg", compact ? "p-2" : "p-3")}>
                  <p className="text-xs text-slate-500 mb-1">副本因子</p>
                  <p className={cn("font-bold text-slate-800", compact ? "text-base" : "text-lg")}>{selectedTopic.replicas}</p>
                </div>
                <div className={cn("bg-slate-50 rounded-lg", compact ? "p-2" : "p-3")}>
                  <p className="text-xs text-slate-500 mb-1">消息总数</p>
                  <p className={cn("font-bold text-slate-800", compact ? "text-base" : "text-lg")}>{(selectedTopic.messages / 1000000).toFixed(2)}M</p>
                </div>
                <div className={cn("bg-slate-50 rounded-lg", compact ? "p-2" : "p-3")}>
                  <p className="text-xs text-slate-500 mb-1">存储大小</p>
                  <p className={cn("font-bold text-slate-800", compact ? "text-base" : "text-lg")}>{selectedTopic.size}</p>
                </div>
              </div>
            </div>

            {/* 配置信息 */}
            <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
              <h4 className={cn("text-sm font-medium text-slate-700", compact ? "mb-2" : "mb-3")}>配置信息</h4>
              <div className={cn("grid grid-cols-2", compact ? "gap-2" : "gap-3")}>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">数据保留时间</span>
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    {formatRetention(selectedTopic.retentionMs)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">清理策略</span>
                  </div>
                  <span className="text-sm font-medium text-slate-800">
                    {selectedTopic.cleanupPolicy === 'delete' ? '删除' : '压缩'}
                  </span>
                </div>
              </div>
            </div>

            {/* 分区详情表格 */}
            <div className={cn("flex-1 overflow-auto", compact ? "p-3" : "p-4")}>
              <h4 className={cn("text-sm font-medium text-slate-700", compact ? "mb-2" : "mb-3")}>分区详情</h4>
              {loadingPartitions ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">分区</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Leader</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">副本</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">ISR</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">消息数</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Offset 范围</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {partitions.map((partition) => (
                      <tr key={partition.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-slate-700">分区-{partition.id}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            Broker-{partition.leader}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 text-xs">
                          {partition.replicas.map(r => `B-${r}`).join(', ')}
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            'text-xs font-medium',
                            partition.isr.length === partition.replicas.length ? 'text-emerald-600' : 'text-amber-600'
                          )}>
                            {partition.isr.length}/{partition.replicas.length} 同步
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 font-mono text-xs">
                          {partition.messages.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-slate-500 font-mono text-xs">
                          {partition.startOffset} - {partition.endOffset}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">请选择一个 Topic 查看详情</p>
            </div>
          </div>
        )}
      </div>

      {/* 新建 Topic 弹窗 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">新建 Topic</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">名称</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="例如: user-events"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">分区数</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.partitions}
                    onChange={(e) => setCreateForm({ ...createForm, partitions: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">副本因子</label>
                  <input
                    type="number"
                    min="1"
                    value={createForm.replicas}
                    onChange={(e) => setCreateForm({ ...createForm, replicas: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isCreating}
              >
                取消
              </button>
              <button
                onClick={handleCreateTopic}
                disabled={isCreating}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
