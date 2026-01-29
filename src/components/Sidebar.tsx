import { useState } from 'react';
import { 
  LayoutDashboard, 
  Server, 
  FolderTree, 
  Users, 
  MessageSquare, 
  Settings,
  ChevronDown,
  Activity,
  Zap,
  Check,
  Circle
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useApp } from '@/contexts/AppContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'brokers', label: 'Brokers 管理', icon: Server },
  { id: 'topics', label: 'Topics 管理', icon: FolderTree },
  { id: 'consumers', label: '消费组管理', icon: Users },
  { id: 'messages', label: '消息查看器', icon: MessageSquare },
  { id: 'simulator', label: '生产消费模拟', icon: Zap },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { clusters, currentCluster, setCurrentCluster } = useApp();
  const [showClusterDropdown, setShowClusterDropdown] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-400';
      case 'connecting':
        return 'bg-amber-400 animate-pulse';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <aside className="w-56 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm leading-tight">Kafka Manager<br/>消息管理系统</span>
          </div>
        </div>
      </div>

      {/* Cluster Selector */}
      <div className="p-3 border-b border-slate-700 relative">
        <button 
          onClick={() => setShowClusterDropdown(!showClusterDropdown)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', getStatusColor(currentCluster?.status || 'disconnected'))}></div>
            <span className="text-sm truncate">{currentCluster?.name || '选择集群'}</span>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', showClusterDropdown && 'rotate-180')} />
        </button>

        {/* Cluster Dropdown */}
        {showClusterDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowClusterDropdown(false)}
            />
            <div className="absolute left-3 right-3 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
              <div className="p-2 text-xs text-slate-400 border-b border-slate-700">选择集群</div>
              {clusters.map((cluster) => (
                <button
                  key={cluster.id}
                  onClick={() => {
                    setCurrentCluster(cluster);
                    setShowClusterDropdown(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 transition-colors cursor-pointer",
                    currentCluster?.id === cluster.id && "bg-slate-700/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Circle className={cn('w-2 h-2', 
                      cluster.status === 'connected' ? 'fill-emerald-400 text-emerald-400' : 
                      cluster.status === 'connecting' ? 'fill-amber-400 text-amber-400' : 
                      'fill-slate-400 text-slate-400'
                    )} />
                    <div className="text-left">
                      <p className="text-sm text-white">{cluster.name}</p>
                      <p className="text-xs text-slate-400">{cluster.version}</p>
                    </div>
                  </div>
                  {currentCluster?.id === cluster.id && (
                    <Check className="w-4 h-4 text-blue-400" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="text-xs text-slate-500 uppercase tracking-wider px-3 py-2">导航菜单</div>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer',
              activeTab === item.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-slate-700">
        <button 
          onClick={() => onTabChange('settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer',
            activeTab === 'settings'
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
          )}
        >
          <Settings className="w-4 h-4" />
          <span>系统设置</span>
        </button>
      </div>

      {/* Version */}
      <div className="p-3 text-xs text-slate-500 text-center border-t border-slate-700/50">
        <p>v2.8.1</p>
        <p className="mt-0.5">Apache Kafka 3.6.0</p>
      </div>
    </aside>
  );
}
