import { useState, useEffect } from 'react';
import { Server, Activity, HardDrive, ArrowDownToLine, ArrowUpFromLine, Cpu, Wifi, Loader2 } from 'lucide-react';
import { brokerApi } from '@/api';
import { cn } from '@/utils/cn';
import { useApp } from '@/contexts/AppContext';
import type { Broker } from '@/types/kafka';

export function Brokers() {
  const { lastRefresh, settings } = useApp();
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<Broker[]>([]);

  const compact = settings.display.compactMode;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await brokerApi.getBrokers();
        setBrokers(data);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [lastRefresh]);

  const onlineCount = brokers.filter(b => b.status === 'online').length;
  const offlineCount = brokers.filter(b => b.status === 'offline').length;
  const totalPartitions = brokers.reduce((acc, b) => acc + b.partitions, 0);

  if (loading && brokers.length === 0) {
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
              <Server className={cn("text-blue-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Broker 总数</p>
              <p className={cn("font-bold text-slate-800", compact ? "text-lg" : "text-xl")}>{brokers.length}</p>
            </div>
          </div>
        </div>
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            <div className={cn("bg-emerald-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
              <Activity className={cn("text-emerald-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">在线 Broker</p>
              <p className={cn("font-bold text-emerald-600", compact ? "text-lg" : "text-xl")}>{onlineCount}</p>
            </div>
          </div>
        </div>
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            <div className={cn("bg-red-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
              <Server className={cn("text-red-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">离线 Broker</p>
              <p className={cn("font-bold text-red-600", compact ? "text-lg" : "text-xl")}>{offlineCount}</p>
            </div>
          </div>
        </div>
        <div className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
          <div className="flex items-center gap-3">
            <div className={cn("bg-violet-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
              <HardDrive className={cn("text-violet-600", compact ? "w-4 h-4" : "w-5 h-5")} />
            </div>
            <div>
              <p className="text-xs text-slate-500">分区总数</p>
              <p className={cn("font-bold text-slate-800", compact ? "text-lg" : "text-xl")}>{totalPartitions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Broker 列表 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className={cn("border-b border-slate-100 flex items-center justify-between", compact ? "px-3 py-2" : "px-4 py-3")}>
          <h3 className="font-semibold text-slate-800">Broker 列表</h3>
          <span className="text-xs text-slate-500">共 {brokers.length} 个节点</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>Broker ID</th>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>主机地址</th>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>端口</th>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>状态</th>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>分区数</th>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>入站流量</th>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>出站流量</th>
                <th className={cn("text-left text-xs font-medium text-slate-500 uppercase tracking-wider", compact ? "px-3 py-2" : "px-4 py-3")}>版本</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {brokers.map((broker) => (
                <tr key={broker.id} className="hover:bg-slate-50 transition-colors">
                  <td className={cn(compact ? "px-3 py-2" : "px-4 py-3")}>
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-slate-800">Broker-{broker.id}</span>
                    </div>
                  </td>
                  <td className={cn("text-sm text-slate-600 font-mono", compact ? "px-3 py-2" : "px-4 py-3")}>{broker.host}</td>
                  <td className={cn("text-sm text-slate-600 font-mono", compact ? "px-3 py-2" : "px-4 py-3")}>{broker.port}</td>
                  <td className={cn(compact ? "px-3 py-2" : "px-4 py-3")}>
                    <span className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                      broker.status === 'online' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-red-100 text-red-700'
                    )}>
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        broker.status === 'online' ? 'bg-emerald-500' : 'bg-red-500'
                      )}></span>
                      {broker.status === 'online' ? '在线' : '离线'}
                    </span>
                  </td>
                  <td className={cn("text-sm text-slate-600", compact ? "px-3 py-2" : "px-4 py-3")}>{broker.partitions}</td>
                  <td className={cn(compact ? "px-3 py-2" : "px-4 py-3")}>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <ArrowDownToLine className="w-3.5 h-3.5 text-blue-500" />
                      {(broker.bytesIn / 1024).toFixed(1)} KB/s
                    </div>
                  </td>
                  <td className={cn(compact ? "px-3 py-2" : "px-4 py-3")}>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <ArrowUpFromLine className="w-3.5 h-3.5 text-emerald-500" />
                      {(broker.bytesOut / 1024).toFixed(1)} KB/s
                    </div>
                  </td>
                  <td className={cn("text-sm text-slate-500", compact ? "px-3 py-2" : "px-4 py-3")}>{broker.version || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broker 详情卡片 */}
      <div className={cn("grid grid-cols-3", compact ? "gap-3" : "gap-4")}>
        {brokers.filter(b => b.status === 'online').map((broker) => (
          <div key={broker.id} className={cn("bg-white rounded-xl shadow-sm border border-slate-100", compact ? "p-3" : "p-4")}>
            <div className={cn("flex items-center justify-between", compact ? "mb-3" : "mb-4")}>
              <div className="flex items-center gap-2">
                <div className={cn("bg-blue-100 rounded-lg flex items-center justify-center", compact ? "w-8 h-8" : "w-10 h-10")}>
                  <Server className={cn("text-blue-600", compact ? "w-4 h-4" : "w-5 h-5")} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Broker-{broker.id}</p>
                  <p className="text-xs text-slate-500">{broker.host}:{broker.port}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                运行中
              </span>
            </div>

            <div className={cn("grid grid-cols-2", compact ? "gap-2 mb-3" : "gap-3 mb-4")}>
              <div className={cn("bg-slate-50 rounded-lg", compact ? "p-2" : "p-3")}>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <HardDrive className="w-3.5 h-3.5" />
                  分区数
                </div>
                <p className={cn("font-bold text-slate-800", compact ? "text-base" : "text-lg")}>{broker.partitions}</p>
              </div>
              <div className={cn("bg-slate-50 rounded-lg", compact ? "p-2" : "p-3")}>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Cpu className="w-3.5 h-3.5" />
                  机架
                </div>
                <p className={cn("font-bold text-slate-800", compact ? "text-base" : "text-lg")}>{broker.rack || '-'}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ArrowDownToLine className="w-3 h-3 text-blue-500" />
                    入站流量
                  </span>
                  <span className="text-blue-600 font-medium">{(broker.bytesIn / 1024).toFixed(1)} KB/s</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.min((broker.bytesIn / 150000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <ArrowUpFromLine className="w-3 h-3 text-emerald-500" />
                    出站流量
                  </span>
                  <span className="text-emerald-600 font-medium">{(broker.bytesOut / 1024).toFixed(1)} KB/s</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min((broker.bytesOut / 150000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Wifi className="w-3 h-3 text-violet-500" />
                    负载占比
                  </span>
                  <span className="text-violet-600 font-medium">{((broker.partitions / totalPartitions) * 100).toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${(broker.partitions / totalPartitions) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
