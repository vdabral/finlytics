import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  MoonIcon,
  SunIcon,
  UserIcon,
  KeyIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'account' | 'advanced'>('general');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    marketAlerts: true,
    portfolioAlerts: true,
    weeklyReports: true,
    dataSharing: false,
    publicProfile: false,
    twoFactorAuth: false,
    autoRefresh: true,
    compactView: false,
    currency: 'USD',
    language: 'en',
    timezone: 'UTC'
  });

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'privacy', name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'account', name: 'Account', icon: UserIcon },
    { id: 'advanced', name: 'Advanced', icon: ChartBarIcon },
  ];

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success('Setting updated successfully');
  };

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
    toast.success(`Switched to ${isDarkMode ? 'light' : 'dark'} theme`);
  };

  const handleSaveSettings = () => {
    // TODO: Implement actual settings save API call
    toast.success('Settings saved successfully!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        emailNotifications: true,
        pushNotifications: false,
        marketAlerts: true,
        portfolioAlerts: true,
        weeklyReports: true,
        dataSharing: false,
        publicProfile: false,
        twoFactorAuth: false,
        autoRefresh: true,
        compactView: false,
        currency: 'USD',
        language: 'en',
        timezone: 'UTC'
      });
      toast.success('Settings reset to default');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // TODO: Implement account deletion
      toast.error('Account deletion feature will be available soon');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="glass-card p-6 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold gradient-text mb-2">Settings</h1>
                <p className="text-secondary-600 dark:text-secondary-400">
                  Manage your account preferences and application settings
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/profile')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="btn-primary flex items-center space-x-2"
                >
                  <CheckIcon className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 border border-white/20">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'general' | 'notifications' | 'privacy' | 'account' | 'advanced')}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                          : 'text-secondary-600 dark:text-secondary-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-white/50 dark:hover:bg-secondary-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="glass-card p-8 border border-white/20">
              
              {/* General Settings */}
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">General Settings</h2>
                  
                  <div className="space-y-6">
                    {/* Theme Settings */}
                    <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Appearance</h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {isDarkMode ? (
                            <MoonIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                          ) : (
                            <SunIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                          )}
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Dark Mode
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Switch between light and dark themes
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleThemeToggle}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            isDarkMode ? 'bg-primary-600' : 'bg-secondary-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                              isDarkMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Display Settings */}
                    <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Display</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Compact View
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Show more information in less space
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('compactView', !settings.compactView)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.compactView ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.compactView ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Auto Refresh
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Automatically refresh portfolio data
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('autoRefresh', !settings.autoRefresh)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.autoRefresh ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Regional Settings */}
                    <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Regional</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Currency
                          </label>
                          <select
                            value={settings.currency}
                            onChange={(e) => handleSettingChange('currency', e.target.value)}
                            className="input-field"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                            <option value="INR">INR - Indian Rupee</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Language
                          </label>
                          <select
                            value={settings.language}
                            onChange={(e) => handleSettingChange('language', e.target.value)}
                            className="input-field"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="ja">Japanese</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                            Timezone
                          </label>
                          <select
                            value={settings.timezone}
                            onChange={(e) => handleSettingChange('timezone', e.target.value)}
                            className="input-field"
                          >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time</option>
                            <option value="America/Chicago">Central Time</option>
                            <option value="America/Denver">Mountain Time</option>
                            <option value="America/Los_Angeles">Pacific Time</option>
                            <option value="Europe/London">London</option>
                            <option value="Europe/Paris">Paris</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                            <option value="Asia/Kolkata">India</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">Notification Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Email Notifications
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Receive notifications via email
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.emailNotifications ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Market Alerts
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Get notified about significant market changes
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('marketAlerts', !settings.marketAlerts)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.marketAlerts ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.marketAlerts ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Portfolio Alerts
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Notifications about your portfolio performance
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('portfolioAlerts', !settings.portfolioAlerts)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.portfolioAlerts ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.portfolioAlerts ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Weekly Reports
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Receive weekly portfolio summary reports
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('weeklyReports', !settings.weeklyReports)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.weeklyReports ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.weeklyReports ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Push Notifications</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-medium text-secondary-900 dark:text-secondary-100">
                            Browser Notifications
                          </label>
                          <p className="text-sm text-secondary-600 dark:text-secondary-400">
                            Receive real-time notifications in your browser
                          </p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('pushNotifications', !settings.pushNotifications)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            settings.pushNotifications ? 'bg-primary-600' : 'bg-secondary-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                              settings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Settings */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">Privacy Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Data & Privacy</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Public Profile
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Make your portfolio publicly visible
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('publicProfile', !settings.publicProfile)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.publicProfile ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.publicProfile ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-secondary-900 dark:text-secondary-100">
                              Data Sharing
                            </label>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400">
                              Share anonymous usage data to improve the service
                            </p>
                          </div>
                          <button
                            onClick={() => handleSettingChange('dataSharing', !settings.dataSharing)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.dataSharing ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.dataSharing ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">Account Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-white/50 dark:bg-secondary-800/50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-secondary-800 dark:text-secondary-200 mb-4">Security</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <KeyIcon className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                            <div>
                              <label className="font-medium text-secondary-900 dark:text-secondary-100">
                                Two-Factor Authentication
                              </label>
                              <p className="text-sm text-secondary-600 dark:text-secondary-400">
                                Add an extra layer of security to your account
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSettingChange('twoFactorAuth', !settings.twoFactorAuth)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              settings.twoFactorAuth ? 'bg-primary-600' : 'bg-secondary-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ${
                                settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-secondary-200 dark:border-secondary-700">
                          <div>
                            <button
                              onClick={() => navigate('/profile?tab=security')}
                              className="btn-secondary flex items-center space-x-2"
                            >
                              <KeyIcon className="w-4 h-4" />
                              <span>Change Password</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-4 flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                        Danger Zone
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-red-900 dark:text-red-300">
                              Reset All Settings
                            </label>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              Reset all settings to their default values
                            </p>
                          </div>
                          <button
                            onClick={handleResetSettings}
                            className="btn-secondary text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Reset Settings
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-red-200 dark:border-red-800">
                          <div>
                            <label className="font-medium text-red-900 dark:text-red-300">
                              Delete Account
                            </label>
                            <p className="text-sm text-red-700 dark:text-red-400">
                              Permanently delete your account and all data
                            </p>
                          </div>
                          <button
                            onClick={handleDeleteAccount}
                            className="btn-danger"
                          >
                            Delete Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              {activeTab === 'advanced' && (
                <div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-secondary-100 mb-6">Advanced Settings</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-400">
                          Advanced Settings
                        </h3>
                      </div>
                      <p className="text-amber-700 dark:text-amber-300 mb-4">
                        These settings are for advanced users only. Changing them may affect the application's performance and functionality.
                      </p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                            API Refresh Interval (seconds)
                          </label>
                          <input
                            type="number"
                            min="30"
                            max="300"
                            defaultValue="60"
                            className="input-field w-32"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                            Cache Duration (minutes)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="60"
                            defaultValue="15"
                            className="input-field w-32"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                            Debug Mode
                          </label>
                          <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                            Enable debug logging (may impact performance)
                          </p>
                          <button
                            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 bg-secondary-300"
                          >
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
