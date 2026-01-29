import { useState, useEffect } from 'react';
import { 
  Server, 
  FolderTree, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { brokerApi, topicApi, consumerGroupApi, clusterApi, chartApi } from '@/api';
import { cn } from '@/utils/cn';
import { useApp } from '@/contexts/AppContext';
import type { Broker, Topic, ConsumerGroup, ChartDataPoint } from '@/types/kafka';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; up: boolean };
  color: 'blue' | 'green' | 'purple' | 'orange';
  compact?: boolean;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color, compact }: StatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-violet-500 to-violet-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{title}</p>
          <p className={cn("font-bold text-slate-800 mt-1", compact ? "text-xl" : "text-2xl")}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-1 text-xs', trend.up ? 'text-emerald-500' : 'text-red-500')}>
              {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{trend.value}% 较昨日</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg bg-gradient-to-br flex items-center justify-center', colorClasses[color], compact ? "w-8 h-8" : "w-10 h-10")}>
          <Icon className={cn("text-white", compact ? "w-4 h-4" : "w-5 h-5")} />
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { lastRefresh, settings, currentCluster } = useApp();
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [consumerGroups, setConsumerGroups] = useState<ConsumerGroup[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [clusterStats, setClusterStats] = useState<{
    messagesPerSec: number;
    underReplicatedPartitions: number;
    offlinePartitions: number;
    totalPartitions: number;
  } | null>(null);

  const compact = settings.display.compactMode;

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [brokersRes, topicsRes, groupsRes, chartRes, statsRes] = await Promise.all([
          brokerApi.getBrokers(),
          topicApi.getTopics(),
          consumerGroupApi.getConsumerGroups(),
          chartApi.getChartData(),
          clusterApi.getClusterStats(currentCluster?.id || 'prod'),
        ]);
        setBrokers(brokersRes);
        setTopics(topicsRes);
        setConsumerGroups(groupsRes);
        setChartData(chartRes);
        setClusterStats(statsRes);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lastRefresh, currentCluster?.id]);

  const onlineBrokers = brokers.filter(b => b.status === 'online').length;
  const stableGroups = consumerGroups.filter(g => g.state === 'Stable').length;
  const totalPartitions = clusterStats?.totalPartitions || brokers.reduce((acc, b) => acc + b.partitions, 0);

  if (loading && brokers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* 更新时间提示 */}
      {settings.display.showTimestamps && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3 h-3" />
          <span>数据更新时间: {lastRefresh.toLocaleTimeString()}</span>
        </div>
      )}

      {/* 统计卡片 */}
      <div className={cn("grid grid-cols-4", compact ? "gap-3" : "gap-4")}>
        <StatCard
          title="Brokers"
          value={`${onlineBrokers}/${brokers.length}`}
          subtitle="在线 / 总数"
          icon={Server}
          color="blue"
          compact={compact}
        />
        <StatCard
          title="Topics"
          value={topics.length}
          subtitle={`${totalPartitions} 个分区`}
          icon={FolderTree}
          trend={undefined}
          color="green"
          compact={compact}
        />
        <StatCard
          title="消费组"
          value={consumerGroups.length}
          subtitle={`${stableGroups} 个稳定运行`}
          icon={Users}
          color="purple"
          compact={compact}
        />
        <StatCard
          title="消息吞吐"
          value={clusterStats?.messagesPerSec ? `${(clusterStats.messagesPerSec / 1000).toFixed(1)}K` : '0'}
          subtitle="条消息/秒"
          icon={Activity}
          trend={undefined}
          color="orange"
          compact={compact}
        />
      </div>

      {/* 图表区域 */}
      <div className={cn("grid grid-cols-3", compact ? "gap-3" : "gap-4")}>
        {/* 主图表 */}
        <div className={cn("col-span-2 bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className={cn("flex items-center justify-between", compact ? "mb-3" : "mb-4")}>
            <h3 className="font-semibold text-slate-800">消息吞吐趋势 (24小时)</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                <span className="text-slate-500">流入消息</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                <span className="text-slate-500">流出消息</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={compact ? 160 : 200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff'
                }}
                formatter={(value, name) => [
                  `${Number(value).toLocaleString()} 条`,
                  name === 'messagesIn' ? '流入' : '流出'
                ]}
              />
              <Area type="monotone" dataKey="messagesIn" stroke="#3b82f6" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
              <Area type="monotone" dataKey="messagesOut" stroke="#10b981" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Broker 分区分布 */}
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <h3 className={cn("font-semibold text-slate-800", compact ? "mb-3" : "mb-4")}>Broker 分区分布</h3>
          <ResponsiveContainer width="100%" height={compact ? 160 : 200}>
            <BarChart data={brokers.filter(b => b.status === 'online')}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="id" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `B-${v}`} />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff'
                }}
                formatter={(value) => [`${Number(value)} 个分区`, '分区数']}
              />
              <Bar dataKey="partitions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 底部信息区 */}
      <div className={cn("grid grid-cols-3", compact ? "gap-3" : "gap-4")}>
        {/* 集群状态 */}
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <h3 className={cn("font-semibold text-slate-800", compact ? "mb-2" : "mb-3")}>集群健康状态</h3>
          <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
            <div className={cn("flex items-center justify-between bg-emerald-50 rounded-lg border border-emerald-100", compact ? "py-1.5 px-2" : "py-2 px-3")}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-slate-700">集群状态</span>
              </div>
              <span className="text-xs text-emerald-600 font-medium">运行正常</span>
            </div>
            <div className={cn("flex items-center justify-between bg-amber-50 rounded-lg border border-amber-100", compact ? "py-1.5 px-2" : "py-2 px-3")}>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-slate-700">副本不足分区</span>
              </div>
              <span className="text-xs text-amber-600 font-medium">{clusterStats?.underReplicatedPartitions || 0} 个</span>
            </div>
            <div className={cn("flex items-center justify-between bg-slate-50 rounded-lg border border-slate-200", compact ? "py-1.5 px-2" : "py-2 px-3")}>
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">离线分区</span>
              </div>
              <span className="text-xs text-slate-600 font-medium">{clusterStats?.offlinePartitions || 0} 个</span>
            </div>
          </div>
        </div>

        {/* 热门 Topics */}
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <h3 className={cn("font-semibold text-slate-800", compact ? "mb-2" : "mb-3")}>热门 Topics (按大小)</h3>
          <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
            {topics.slice(0, 5).map((topic, index) => (
              <div key={topic.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-slate-700 truncate max-w-[140px]" title={topic.name}>
                    {topic.name}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">{topic.size}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 消费延迟排行 */}
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <h3 className={cn("font-semibold text-slate-800", compact ? "mb-2" : "mb-3")}>消费延迟排行 (Top 5)</h3>
          <div className={cn(compact ? "space-y-1.5" : "space-y-2")}>
            {consumerGroups
              .sort((a, b) => b.lag - a.lag)
              .slice(0, 5)
              .map((group) => (
                <div key={group.name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-700 truncate max-w-[150px]" title={group.name}>
                    {group.name}
                  </span>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded',
                    group.lag > 5000 ? 'bg-red-100 text-red-600' : 
                    group.lag > 1000 ? 'bg-amber-100 text-amber-600' : 
                    'bg-emerald-100 text-emerald-600'
                  )}>
                    {group.lag.toLocaleString()} 条
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
