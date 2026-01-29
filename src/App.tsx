import { useState } from 'react';
import { AppProvider, useApp } from '@/contexts/AppContext';
import { Login } from '@/components/Login';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { Brokers } from '@/components/Brokers';
import { Topics } from '@/components/Topics';
import { ConsumerGroups } from '@/components/ConsumerGroups';
import { MessageViewer } from '@/components/MessageViewer';
import { Simulator } from '@/components/Simulator';
import { Settings } from '@/components/Settings';
import { Profile } from '@/components/Profile';

function AppContent() {
  const { isAuthenticated, currentCluster } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  // 未登录时显示登录页
  if (!isAuthenticated) {
    return <Login />;
  }

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { 
          title: '仪表盘', 
          subtitle: `${currentCluster?.name || '未连接'} · ${currentCluster?.version || ''}`
        };
      case 'brokers':
        return { 
          title: 'Brokers 管理', 
          subtitle: '管理和监控 Kafka Broker 节点'
        };
      case 'topics':
        return { 
          title: 'Topics 管理', 
          subtitle: '管理 Topic 及其分区配置'
        };
      case 'consumers':
        return { 
          title: '消费组管理', 
          subtitle: '监控消费组状态和消费延迟'
        };
      case 'messages':
        return { 
          title: '消息查看器', 
          subtitle: '浏览和搜索 Topic 中的消息'
        };
      case 'simulator':
        return { 
          title: '生产消费模拟', 
          subtitle: '模拟消息的生产和消费'
        };
      case 'settings':
        return { 
          title: '系统设置', 
          subtitle: '配置系统参数和个人偏好'
        };
      case 'profile':
        return { 
          title: '个人信息', 
          subtitle: '管理您的账户信息'
        };
      default:
        return { title: '仪表盘', subtitle: '' };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'brokers':
        return <Brokers />;
      case 'topics':
        return <Topics />;
      case 'consumers':
        return <ConsumerGroups />;
      case 'messages':
        return <MessageViewer />;
      case 'simulator':
        return <Simulator />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  const pageInfo = getPageInfo();

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 侧边栏 */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 主内容区 */}
      <div className="ml-56">
        {/* 顶部栏 */}
        <Header 
          title={pageInfo.title} 
          subtitle={pageInfo.subtitle}
          onNavigate={setActiveTab}
        />

        {/* 页面内容 */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
