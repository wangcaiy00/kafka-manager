import { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Play, 
  Pause, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Search,
  RotateCcw,
  XCircle,
  Loader2
} from 'lucide-react';
import { consumerGroupApi } from '@/api';
import { cn } from '@/utils/cn';
import { useApp } from '@/contexts/AppContext';
import type { ConsumerGroup, Consumer } from '@/types/kafka';

export function ConsumerGroups() {
  const { lastRefresh, settings } = useApp();
  const [loading, setLoading] = useState(true);
  const [consumerGroups, setConsumerGroups] = useState<ConsumerGroup[]>([]);
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'Stable' | 'Rebalancing' | 'Dead' | 'Empty'>('all');
  const [loadingDetail, setLoadingDetail] = useState(false);

  const compact = settings.display.compactMode;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [groups, consumerList] = await Promise.all([
          consumerGroupApi.getConsumerGroups(),
          consumerGroupApi.getConsumers(),
        ]);
        setConsumerGroups(groups);
        setConsumers(consumerList);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lastRefresh]);

  // 展开消费组时加载详情
  const handleExpandGroup = async (groupName: string) => {
    if (expandedGroup === groupName) {
      setExpandedGroup(null);
      return;
    }
    
    setExpandedGroup(groupName);
    setLoadingDetail(true);
    try {
      const detail = await consumerGroupApi.getConsumerGroupDetail(groupName);
      if (detail.consumers.length > 0) {
        // 更新消费者数据
        setConsumers(prev => {
          const existing = prev.filter(c => !detail.group?.topics.includes(c.topic));
          return [...existing, ...detail.consumers];
        });
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStateColor = (state: ConsumerGroup['state']) => {
    switch (state) {
      case 'Stable':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rebalancing':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Dead':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Empty':
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStateLabel = (state: ConsumerGroup['state']) => {
    switch (state) {
      case 'Stable': return '稳定';
      case 'Rebalancing': return '再平衡中';
      case 'Dead': return '已停止';
      case 'Empty': return '空闲';
    }
  };

  const getStateIcon = (state: ConsumerGroup['state']) => {
    switch (state) {
      case 'Stable':
        return <Play className="w-3 h-3" />;
      case 'Rebalancing':
        return <RefreshCw className="w-3 h-3 animate-spin" />;
      case 'Dead':
        return <XCircle className="w-3 h-3" />;
      case 'Empty':
        return <Pause className="w-3 h-3" />;
    }
  };

  const filteredGroups = consumerGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = stateFilter === 'all' || group.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const stableCount = consumerGroups.filter(g => g.state === 'Stable').length;
  const rebalancingCount = consumerGroups.filter(g => g.state === 'Rebalancing').length;
  const deadCount = consumerGroups.filter(g => g.state === 'Dead').length;
  const emptyCount = consumerGroups.filter(g => g.state === 'Empty').length;
  const totalLag = consumerGroups.reduce((acc, g) => acc + g.lag, 0);

  if (loading && consumerGroups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* 统计卡片 */}
      <div className={cn("grid grid-cols-4", compact ? "gap-3" : "gap-4")}>
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            <div className={cn("bg-blue-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
              <Users className={cn("text-blue-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">消费组总数</p>
              <p className={cn("font-bold text-slate-800", compact ? "text-lg" : "text-xl")}>{consumerGroups.length}</p>
            </div>
          </div>
        </div>
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            <div className={cn("bg-emerald-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
              <Activity className={cn("text-emerald-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">稳定运行</p>
              <p className={cn("font-bold text-emerald-600", compact ? "text-lg" : "text-xl")}>{stableCount}</p>
            </div>
          </div>
        </div>
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            <div className={cn("bg-amber-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
              <RotateCcw className={cn("text-amber-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">再平衡/停止</p>
              <p className={cn("font-bold text-amber-600", compact ? "text-lg" : "text-xl")}>{rebalancingCount + deadCount + emptyCount}</p>
            </div>
          </div>
        </div>
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            <div className={cn("bg-red-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
              <AlertTriangle className={cn("text-red-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">总消费延迟</p>
              <p className={cn("font-bold text-red-600", compact ? "text-lg" : "text-xl")}>{totalLag.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 消费组列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        <div className={cn("border-b border-slate-100", compact ? "p-3" : "p-4")}>
          <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-3")}>
            <h3 className="font-semibold text-slate-800">消费组列表</h3>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索消费组..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            {(['all', 'Stable', 'Rebalancing', 'Dead', 'Empty'] as const).map((state) => {
              const counts = {
                all: consumerGroups.length,
                Stable: stableCount,
                Rebalancing: rebalancingCount,
                Dead: deadCount,
                Empty: emptyCount,
              };
              const labels = {
                all: '全部',
                Stable: '稳定',
                Rebalancing: '再平衡',
                Dead: '已停止',
                Empty: '空闲',
              };
              return (
                <button
                  key={state}
                  onClick={() => setStateFilter(state)}
                  className={cn(
                    "px-3 py-1 text-xs rounded-full transition-colors",
                    stateFilter === state
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {labels[state]} ({counts[state]})
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredGroups.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">未找到匹配的消费组</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.name}>
                {/* 消费组头部 */}
                <div
                  onClick={() => handleExpandGroup(group.name)}
                  className={cn(
                    "hover:bg-slate-50 cursor-pointer transition-colors",
                    compact ? "p-3" : "p-4"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button className="p-0.5">
                        {expandedGroup === group.name ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-800">{group.name}</span>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
                        getStateColor(group.state)
                      )}>
                        {getStateIcon(group.state)}
                        {getStateLabel(group.state)}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-slate-400">成员数:</span>
                        <span className="ml-1 text-slate-700 font-medium">{group.members}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">订阅 Topics:</span>
                        <span className="ml-1 text-slate-700 font-medium">{group.topics.length}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">协调器:</span>
                        <span className="ml-1 text-slate-700 font-medium">Broker-{group.coordinator}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">延迟:</span>
                        <span className={cn(
                          'ml-1 font-medium',
                          group.lag > 5000 ? 'text-red-600' :
                          group.lag > 1000 ? 'text-amber-600' :
                          'text-emerald-600'
                        )}>
                          {group.lag.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 订阅的 Topics 标签 */}
                  <div className="flex items-center gap-2 mt-2 ml-8">
                    {group.topics.map(topic => (
                      <span key={topic} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded border border-blue-100">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 展开的成员列表 */}
                {expandedGroup === group.name && (
                  <div className={cn("bg-slate-50 border-t border-slate-100", compact ? "px-3 py-2" : "px-4 py-3")}>
                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">消费者成员详情</h4>
                    {loadingDetail ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                      </div>
                    ) : consumers.filter(c => group.topics.includes(c.topic)).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left">
                              <th className="px-3 py-2 text-xs font-medium text-slate-500">客户端 ID</th>
                              <th className="px-3 py-2 text-xs font-medium text-slate-500">主机</th>
                              <th className="px-3 py-2 text-xs font-medium text-slate-500">Topic</th>
                              <th className="px-3 py-2 text-xs font-medium text-slate-500">分区</th>
                              <th className="px-3 py-2 text-xs font-medium text-slate-500">当前 Offset</th>
                              <th className="px-3 py-2 text-xs font-medium text-slate-500">日志末端 Offset</th>
                              <th className="px-3 py-2 text-xs font-medium text-slate-500">延迟</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {consumers
                              .filter(c => group.topics.includes(c.topic))
                              .map((consumer) => (
                                <tr key={consumer.id} className="bg-white">
                                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{consumer.clientId}</td>
                                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{consumer.host}</td>
                                  <td className="px-3 py-2 text-slate-700">{consumer.topic}</td>
                                  <td className="px-3 py-2 text-center">
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                      P-{consumer.partition}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{consumer.currentOffset.toLocaleString()}</td>
                                  <td className="px-3 py-2 font-mono text-xs text-slate-600">{consumer.logEndOffset.toLocaleString()}</td>
                                  <td className="px-3 py-2">
                                    <span className={cn(
                                      'px-2 py-0.5 rounded text-xs font-medium',
                                      consumer.lag > 100 ? 'bg-red-100 text-red-700' :
                                      consumer.lag > 10 ? 'bg-amber-100 text-amber-700' :
                                      'bg-emerald-100 text-emerald-700'
                                    )}>
                                      {consumer.lag}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center py-4 text-sm text-slate-500">暂无消费者成员数据</p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
