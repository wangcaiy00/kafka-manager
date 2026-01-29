import { 
  X, 
  Bell, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/utils/cn';
import type { Notification } from '@/types/kafka';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useApp();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'success':
        return 'bg-emerald-50 border-emerald-200';
    }
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp.replace(' ', 'T'));
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return timestamp.slice(0, 10);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* 通知面板 */}
      <div className="fixed right-4 top-16 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
        {/* 头部 */}
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">通知中心</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-slate-200 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* 操作按钮 */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              全部标为已读
            </button>
            <button
              onClick={clearNotifications}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空通知
            </button>
          </div>
        )}

        {/* 通知列表 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markAsRead(notification.id)}
                  className={cn(
                    "px-4 py-3 cursor-pointer transition-colors",
                    notification.read ? "bg-white" : "bg-blue-50/50"
                  )}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border",
                      getTypeColor(notification.type)
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "text-sm font-medium truncate",
                          notification.read ? "text-slate-700" : "text-slate-900"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(notification.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              查看全部通知
            </button>
          </div>
        )}
      </div>
    </>
  );
}
