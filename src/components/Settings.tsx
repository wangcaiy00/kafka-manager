import { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Monitor, 
  Globe, 
  Clock, 
  Save, 
  RotateCcw,
  Moon,
  Sun,
  Palette,
  Mail,
  AlertTriangle,
  Server,
  Activity,
  CheckCircle
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/utils/cn';

export function Settings() {
  const { settings, updateSettings, addNotification } = useApp();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    setSaved(true);
    addNotification({
      type: 'success',
      title: '设置已保存',
      message: '您的设置已成功保存',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  const themeOptions = [
    { value: 'light', label: '浅色模式', icon: Sun },
    { value: 'dark', label: '深色模式', icon: Moon },
    { value: 'system', label: '跟随系统', icon: Monitor },
  ];

  const refreshOptions = [
    { value: 5, label: '5 秒' },
    { value: 10, label: '10 秒' },
    { value: 30, label: '30 秒' },
    { value: 60, label: '1 分钟' },
    { value: 300, label: '5 分钟' },
  ];

  const dateFormatOptions = [
    { value: 'YYYY-MM-DD HH:mm:ss', label: '2024-01-15 14:30:00' },
    { value: 'DD/MM/YYYY HH:mm:ss', label: '15/01/2024 14:30:00' },
    { value: 'MM/DD/YYYY HH:mm:ss', label: '01/15/2024 14:30:00' },
    { value: 'YYYY年MM月DD日 HH:mm', label: '2024年01月15日 14:30' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">系统设置</h2>
          <p className="text-sm text-slate-500 mt-1">配置系统参数和个人偏好</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "px-4 py-2 text-white rounded-lg transition-all flex items-center gap-2 cursor-pointer",
              saved ? "bg-emerald-500" : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? '已保存' : '保存设置'}
          </button>
        </div>
      </div>

      {/* 主题设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">主题设置</h3>
            <p className="text-sm text-slate-500">选择您喜欢的界面主题</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setLocalSettings({ ...localSettings, theme: option.value as 'light' | 'dark' | 'system' })}
              className={cn(
                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 cursor-pointer",
                localSettings.theme === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <option.icon className={cn(
                "w-6 h-6",
                localSettings.theme === option.value ? "text-blue-500" : "text-slate-400"
              )} />
              <span className={cn(
                "text-sm font-medium",
                localSettings.theme === option.value ? "text-blue-600" : "text-slate-600"
              )}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 语言和区域 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">语言和区域</h3>
            <p className="text-sm text-slate-500">设置显示语言和日期格式</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">显示语言</label>
            <select
              value={localSettings.language}
              onChange={(e) => setLocalSettings({ ...localSettings, language: e.target.value as 'zh-CN' | 'en-US' })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en-US">English (US)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">日期格式</label>
            <select
              value={localSettings.display.dateFormat}
              onChange={(e) => setLocalSettings({ 
                ...localSettings, 
                display: { ...localSettings.display, dateFormat: e.target.value } 
              })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {dateFormatOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 刷新设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">数据刷新</h3>
            <p className="text-sm text-slate-500">配置数据自动刷新间隔</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">自动刷新间隔</label>
          <div className="flex flex-wrap gap-2">
            {refreshOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setLocalSettings({ ...localSettings, refreshInterval: option.value })}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  localSettings.refreshInterval === option.value
                    ? "bg-blue-500 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">通知设置</h3>
            <p className="text-sm text-slate-500">配置告警和通知偏好</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">Broker 离线告警</p>
                <p className="text-xs text-slate-500">当 Broker 离线时发送通知</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notifications.brokerOffline}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  notifications: { ...localSettings.notifications, brokerOffline: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">高延迟告警</p>
                <p className="text-xs text-slate-500">当消费延迟超过阈值时通知</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notifications.highLag}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  notifications: { ...localSettings.notifications, highLag: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">Topic 异常告警</p>
                <p className="text-xs text-slate-500">当 Topic 状态异常时通知</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notifications.topicError}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  notifications: { ...localSettings.notifications, topicError: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-slate-700">邮件通知</p>
                <p className="text-xs text-slate-500">将告警通过邮件发送</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.notifications.email}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  notifications: { ...localSettings.notifications, email: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 显示设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">显示设置</h3>
            <p className="text-sm text-slate-500">自定义界面显示选项</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">紧凑模式</p>
              <p className="text-xs text-slate-500">减少界面间距，显示更多内容</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.display.compactMode}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  display: { ...localSettings.display, compactMode: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700">显示时间戳</p>
              <p className="text-xs text-slate-500">在列表中显示详细时间戳</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.display.showTimestamps}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  display: { ...localSettings.display, showTimestamps: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
