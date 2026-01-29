import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User, Notification, Settings, Cluster } from '@/types/kafka';
import { authApi, clusterApi, notificationApi, settingsApi } from '@/api';

// 默认设置
const defaultSettings: Settings = {
  theme: 'light',
  language: 'zh-CN',
  refreshInterval: 30,
  notifications: {
    brokerOffline: true,
    highLag: true,
    topicError: true,
    email: false,
  },
  display: {
    compactMode: false,
    showTimestamps: true,
    dateFormat: 'YYYY-MM-DD HH:mm:ss',
  },
  security: {
    saslEnabled: false,
    mechanism: 'plain',
    username: '',
    password: '',
    sslEnabled: false,
  },
};

interface AppContextType {
  // 认证状态
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // 通知
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  clearNotifications: () => void;

  // 设置
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;

  // 集群
  clusters: Cluster[];
  currentCluster: Cluster | null;
  setCurrentCluster: (cluster: Cluster) => void;

  // 刷新
  lastRefresh: Date;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;

  // 主题
  isDarkMode: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // 认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('kafka_auth') === 'true';
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kafka_user');
    return saved ? JSON.parse(saved) : null;
  });

  // 通知
  const [notificationList, setNotificationList] = useState<Notification[]>([]);

  // 设置
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  // 初始化加载设置
  useEffect(() => {
    const loadSettings = async () => {
        try {
            const remoteSettings = await settingsApi.getSettings();
            if (remoteSettings) {
                setSettings(prev => ({
                    ...prev,
                    ...remoteSettings,
                    // Ensure nested objects are merged correctly
                    notifications: { ...prev.notifications, ...remoteSettings.notifications },
                    display: { ...prev.display, ...remoteSettings.display },
                    security: { ...prev.security, ...(remoteSettings.security || {}) },
                }));
            } else {
                // Fallback to local storage if API returns nothing (first run)
                const saved = localStorage.getItem('kafka_settings');
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        setSettings(prev => ({ ...prev, ...parsed }));
                    } catch (e) {
                        // ignore
                    }
                }
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    };
    loadSettings();
  }, []);

  // 集群
  const [clusterList, setClusterList] = useState<Cluster[]>([]);
  const [currentCluster, setCurrentClusterState] = useState<Cluster | null>(null);

  // 刷新
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefreshState] = useState(true);

  // 计算未读通知数
  const unreadCount = notificationList.filter(n => !n.read).length;

  // 计算是否深色模式
  const isDarkMode = settings.theme === 'dark' || 
    (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 初始化加载
  useEffect(() => {
    if (isAuthenticated) {
      // 加载集群列表
      clusterApi.getClusters().then(clusters => {
        setClusterList(clusters);
        if (clusters.length > 0 && !currentCluster) {
          setCurrentClusterState(clusters[0]);
        }
      });

      // 加载通知
      notificationApi.getNotifications().then(notifications => {
        setNotificationList(notifications);
      });
    }
  }, [isAuthenticated]);

  // 应用主题设置
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 应用紧凑模式
  useEffect(() => {
    const html = document.documentElement;
    if (settings.display.compactMode) {
      html.classList.add('compact');
    } else {
      html.classList.remove('compact');
    }
  }, [settings.display.compactMode]);

  // 监听系统主题变化
  useEffect(() => {
    if (settings.theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const html = document.documentElement;
      if (mediaQuery.matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  // 登录
  const login = async (username: string, password: string): Promise<boolean> => {
    const result = await authApi.login(username, password);
    if (result.success && result.user) {
      setUser(result.user);
      setIsAuthenticated(true);
      localStorage.setItem('kafka_auth', 'true');
      localStorage.setItem('kafka_user', JSON.stringify(result.user));
      return true;
    }
    return false;
  };

  // 登出
  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setIsAuthenticated(false);
    setNotificationList([]);
    localStorage.removeItem('kafka_auth');
    localStorage.removeItem('kafka_user');
  };

  // 标记通知已读
  const markAsRead = async (id: string) => {
    await notificationApi.markAsRead(id);
    setNotificationList(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // 标记全部已读
  const markAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotificationList(prev => prev.map(n => ({ ...n, read: true })));
  };

  // 添加通知
  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification = await notificationApi.addNotification(notification);
    setNotificationList(prev => [newNotification, ...prev]);
  };

  // 清空通知
  const clearNotifications = async () => {
    await notificationApi.clearNotifications();
    setNotificationList([]);
  };

  // 更新设置
  const updateSettings = useCallback(async (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        ...newSettings,
        notifications: {
          ...prev.notifications,
          ...(newSettings.notifications || {}),
        },
        display: {
          ...prev.display,
          ...(newSettings.display || {}),
        },
        security: {
          ...prev.security,
          ...(newSettings.security || {}),
        },
      };
      
      // Save to API
      settingsApi.updateSettings(updated).catch(console.error);
      // Also save to local storage for backup/offline
      localStorage.setItem('kafka_settings', JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  // 设置当前集群
  const setCurrentCluster = (cluster: Cluster) => {
    setCurrentClusterState(cluster);
    addNotification({
      type: 'info',
      title: '集群切换',
      message: `已切换到 ${cluster.name}`,
    });
  };

  // 刷新数据
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    // 模拟刷新数据
    await new Promise(resolve => setTimeout(resolve, 500));
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, []);

  // 设置自动刷新
  const setAutoRefresh = (enabled: boolean) => {
    setAutoRefreshState(enabled);
  };

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated) return;

    const interval = setInterval(() => {
      refresh();
    }, settings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, isAuthenticated, settings.refreshInterval, refresh]);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        notifications: notificationList,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        clearNotifications,
        settings,
        updateSettings,
        clusters: clusterList,
        currentCluster,
        setCurrentCluster,
        lastRefresh,
        isRefreshing,
        refresh,
        autoRefresh,
        setAutoRefresh,
        isDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
