import { useState } from 'react';
import { 
  Bell, 
  User, 
  RefreshCw, 
  ChevronDown, 
  LogOut, 
  Settings, 
  UserCircle,
  Clock,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { NotificationCenter } from './NotificationCenter';
import { cn } from '@/utils/cn';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onNavigate: (tab: string) => void;
}

export function Header({ title, subtitle, onNavigate }: HeaderProps) {
  const { 
    user, 
    logout, 
    unreadCount, 
    lastRefresh, 
    isRefreshing, 
    refresh, 
    autoRefresh, 
    setAutoRefresh,
    settings 
  } = useApp();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const formatLastRefresh = () => {
    const now = new Date();
    const diff = now.getTime() - lastRefresh.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds} 秒前`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} 分钟前`;
  };

  const getRoleBadge = (role: string) => {
    const labels: Record<string, string> = {
      admin: '管理员',
      operator: '操作员',
      viewer: '访客',
    };
    return labels[role] || role;
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-4">
          {/* 自动刷新切换 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-500">自动刷新</span>
            <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="text-blue-500 cursor-pointer"
          >
              {autoRefresh ? (
                <ToggleRight className="w-6 h-6" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-400" />
              )}
            </button>
            {autoRefresh && (
              <span className="text-xs text-slate-400">{settings.refreshInterval}s</span>
            )}
          </div>

          {/* 刷新按钮 */}
          <button 
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            <span>刷新</span>
          </button>

          {/* 上次刷新时间 */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>更新于 {formatLastRefresh()}</span>
          </div>
          
          {/* 通知按钮 */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationCenter 
              isOpen={showNotifications} 
              onClose={() => setShowNotifications(false)} 
            />
          </div>

          {/* 用户菜单 */}
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 pl-4 border-l border-slate-200 hover:bg-slate-50 rounded-lg p-2 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-800">{user?.username}</p>
                <p className="text-xs text-slate-500">{getRoleBadge(user?.role || '')}</p>
              </div>
              <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', showUserMenu && 'rotate-180')} />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden">
                  <div className="p-3 border-b border-slate-100 bg-slate-50">
                    <p className="font-medium text-slate-800">{user?.username}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <UserCircle className="w-4 h-4" />
                      个人信息
                    </button>
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      系统设置
                    </button>
                  </div>
                  <div className="p-1 border-t border-slate-100">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
