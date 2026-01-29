import { useState } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  Camera, 
  Save, 
  Key,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/utils/cn';

export function Profile() {
  const { user, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [saved, setSaved] = useState(false);
  
  // 个人信息表单
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    displayName: user?.username || '',
    phone: '',
    department: '技术部',
  });

  // 密码修改表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordError, setPasswordError] = useState('');

  const getRoleBadge = (role: string) => {
    const styles = {
      admin: 'bg-red-100 text-red-700 border-red-200',
      operator: 'bg-blue-100 text-blue-700 border-blue-200',
      viewer: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    const labels = {
      admin: '管理员',
      operator: '操作员',
      viewer: '访客',
    };
    return (
      <span className={cn('px-2 py-0.5 text-xs font-medium rounded border', styles[role as keyof typeof styles] || styles.viewer)}>
        {labels[role as keyof typeof labels] || role}
      </span>
    );
  };

  const handleSaveProfile = () => {
    setSaved(true);
    addNotification({
      type: 'success',
      title: '个人信息已更新',
      message: '您的个人信息已成功保存',
    });
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = () => {
    setPasswordError('');
    
    if (!passwordForm.currentPassword) {
      setPasswordError('请输入当前密码');
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError('请输入新密码');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密码长度至少为6位');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('两次输入的密码不一致');
      return;
    }

    addNotification({
      type: 'success',
      title: '密码已更新',
      message: '您的密码已成功修改',
    });
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-6">
        {/* 左侧用户卡片 */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* 封面背景 */}
            <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            
            {/* 头像和基本信息 */}
            <div className="px-6 pb-6">
              <div className="relative -mt-12 mb-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-10 h-10 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors border border-slate-200">
                  <Camera className="w-4 h-4 text-slate-600" />
                </button>
              </div>

              <h3 className="text-xl font-bold text-slate-800">{user?.username}</h3>
              <p className="text-sm text-slate-500 mb-3">{user?.email}</p>
              
              <div className="flex items-center gap-2 mb-4">
                {getRoleBadge(user?.role || 'viewer')}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">创建时间:</span>
                  <span className="text-slate-700">{user?.createdAt?.slice(0, 10)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">最后登录:</span>
                  <span className="text-slate-700">{user?.lastLogin}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 快捷操作 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-3">快捷操作</h4>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeTab === 'profile' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <User className="w-4 h-4" />
                编辑个人信息
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeTab === 'security' ? "bg-blue-50 text-blue-600" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <Key className="w-4 h-4" />
                修改密码
              </button>
            </div>
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1">
          {activeTab === 'profile' ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">个人信息</h3>
                  <p className="text-sm text-slate-500">管理您的账户信息</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">用户名</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">显示名称</label>
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">邮箱地址</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">手机号码</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="请输入手机号码"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">所属部门</label>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">角色权限</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <Shield className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {user?.role === 'admin' ? '管理员' : user?.role === 'operator' ? '操作员' : '访客'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {user?.role === 'admin' ? '拥有系统全部权限' : user?.role === 'operator' ? '可执行操作但无法修改设置' : '仅可查看数据'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className={cn(
                      "px-6 py-2.5 text-white rounded-lg transition-all flex items-center gap-2",
                      saved ? "bg-emerald-500" : "bg-blue-500 hover:bg-blue-600"
                    )}
                  >
                    {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? '已保存' : '保存更改'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">修改密码</h3>
                  <p className="text-sm text-slate-500">更新您的登录密码</p>
                </div>
              </div>

              <div className="space-y-5">
                {passwordError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">当前密码</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="请输入当前密码"
                      className="w-full px-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">新密码</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="请输入新密码（至少6位）"
                      className="w-full px-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">确认新密码</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="请再次输入新密码"
                      className="w-full px-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Key className="w-4 h-4" />
                    更新密码
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
