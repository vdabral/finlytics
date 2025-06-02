import React, { useState } from 'react';
import { useAppSelector } from '../hooks/redux';
import { toast } from 'react-toastify';
import { formatDate } from '../lib/utils';
import type { ErrorResponse } from '../types';

interface ProfileForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;
  currency: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  marketingEmails: boolean;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const Profile: React.FC = () => {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London Time (GMT)' },
    { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'hi', name: 'Hindi' },
  ];

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateProfileForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!profileForm.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profileForm.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!profileForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Email is invalid';
    }    if (profileForm.phone && !/^\+?[\d\s\-()]+$/.test(profileForm.phone)) {
      newErrors.phone = 'Phone number is invalid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Implement updateProfile action
      // await dispatch(updateProfile(profileForm)).unwrap();
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse;
      console.error('Error updating profile:', error);
      toast.error(errorResponse.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Implement changePassword action
      // await dispatch(changePassword(passwordForm)).unwrap();
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse;
      console.error('Error changing password:', error);
      toast.error(errorResponse.message || 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      // TODO: Implement deleteAccount action
      toast.success('Account deletion initiated. Please check your email for confirmation.');    } catch (error: unknown) {
      const errorResponse = error as ErrorResponse;
      console.error('Error deleting account:', error);
      toast.error(errorResponse.message || 'Failed to delete account');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                Profile Settings
              </h1>
              <p className="mt-3 text-lg text-gray-300">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-500/30 rounded-lg text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="btn-primary px-4 py-2 text-sm font-medium"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="glass-card p-4">              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'profile' | 'security' | 'notifications' | 'preferences')}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="mr-3 text-base">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-white">Profile Information</h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 border border-gray-500/30 rounded-lg text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  {/* Profile Photo */}                  <div className="mb-8 flex items-center">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                      {user?.profilePicture ? (
                        <img
                          className="h-24 w-24 rounded-full object-cover"
                          src={user.profilePicture}
                          alt={`${user.firstName} ${user.lastName}`}
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {profileForm.firstName.charAt(0)}{profileForm.lastName.charAt(0)}
                        </span>
                      )}
                    </div>
                    {isEditing && (
                      <div className="ml-6">
                        <button className="px-4 py-2 border border-gray-500/30 rounded-lg text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200">
                          Change Photo
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={profileForm.firstName}
                        onChange={handleProfileInputChange}
                        disabled={!isEditing}
                        className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                          isEditing 
                            ? 'border-gray-500/30 bg-white/10 text-white placeholder-gray-400' 
                            : 'border-gray-600/30 bg-gray-800/50 text-gray-300'
                        } ${errors.firstName ? 'border-red-400' : ''}`}
                      />
                      {errors.firstName && (
                        <p className="mt-2 text-sm text-red-400">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={profileForm.lastName}
                        onChange={handleProfileInputChange}
                        disabled={!isEditing}
                        className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                          isEditing 
                            ? 'border-gray-500/30 bg-white/10 text-white placeholder-gray-400' 
                            : 'border-gray-600/30 bg-gray-800/50 text-gray-300'
                        } ${errors.lastName ? 'border-red-400' : ''}`}
                      />
                      {errors.lastName && (
                        <p className="mt-2 text-sm text-red-400">{errors.lastName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        onChange={handleProfileInputChange}
                        disabled={!isEditing}
                        className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                          isEditing 
                            ? 'border-gray-500/30 bg-white/10 text-white placeholder-gray-400' 
                            : 'border-gray-600/30 bg-gray-800/50 text-gray-300'
                        } ${errors.email ? 'border-red-400' : ''}`}
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-400">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileForm.phone}
                        onChange={handleProfileInputChange}
                        disabled={!isEditing}
                        placeholder="+1 (555) 123-4567"
                        className={`block w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                          isEditing 
                            ? 'border-gray-500/30 bg-white/10 text-white placeholder-gray-400' 
                            : 'border-gray-600/30 bg-gray-800/50 text-gray-300'
                        } ${errors.phone ? 'border-red-400' : ''}`}
                      />
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-400">{errors.phone}</p>
                      )}
                    </div>
                  </div>

                  {user && (
                    <div className="mt-8 pt-8 border-t border-white/10">
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <dt className="text-sm font-medium text-gray-400">Member Since</dt>
                          <dd className="mt-1 text-lg font-semibold text-white">
                            {formatDate(user.createdAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-400">Email Status</dt>
                          <dd className="mt-1 flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${user.isEmailVerified ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                            <span className={`text-sm font-medium ${user.isEmailVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {user.isEmailVerified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              )}              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Security Settings</h3>

                  {/* Change Password */}
                  <div className="mb-8 p-6 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-lg font-medium text-white mb-4">Change Password</h4>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordInputChange}
                          className={`block w-full px-4 py-3 border rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                            errors.currentPassword ? 'border-red-400' : 'border-gray-500/30'
                          }`}
                        />
                        {errors.currentPassword && (
                          <p className="mt-2 text-sm text-red-400">{errors.currentPassword}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordInputChange}
                          className={`block w-full px-4 py-3 border rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                            errors.newPassword ? 'border-red-400' : 'border-gray-500/30'
                          }`}
                        />
                        {errors.newPassword && (
                          <p className="mt-2 text-sm text-red-400">{errors.newPassword}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordInputChange}
                          className={`block w-full px-4 py-3 border rounded-lg bg-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                            errors.confirmPassword ? 'border-red-400' : 'border-gray-500/30'
                          }`}
                        />
                        {errors.confirmPassword && (
                          <p className="mt-2 text-sm text-red-400">{errors.confirmPassword}</p>
                        )}
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="btn-primary w-full py-3 text-sm font-medium"
                      >
                        {isSaving ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="mb-8 p-6 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-lg font-medium text-white mb-4">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-300 mb-4">
                      Add an extra layer of security to your account by requiring a verification code in addition to your password.
                    </p>
                    <button className="px-4 py-2 border border-gray-500/30 rounded-lg text-sm font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition-all duration-200">
                      Enable Two-Factor Authentication
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/30">
                    <h4 className="text-lg font-medium text-red-400 mb-4">Danger Zone</h4>
                    <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
                      <h5 className="text-sm font-medium text-red-400">Delete Account</h5>
                      <p className="text-sm text-red-300 mt-1">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={handleDeleteAccount}
                        className="mt-3 px-4 py-2 border border-red-400 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all duration-200"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Notification Preferences</h3>

                  <div className="space-y-6">
                    <div className="flex items-start p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center h-5">
                        <input
                          id="emailNotifications"
                          name="emailNotifications"
                          type="checkbox"
                          checked={profileForm.emailNotifications}
                          onChange={handleProfileInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 rounded bg-white/10"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="emailNotifications" className="font-medium text-white">
                          Email Notifications
                        </label>
                        <p className="text-gray-300 text-sm mt-1">
                          Receive email notifications about your portfolio performance and market updates.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center h-5">
                        <input
                          id="pushNotifications"
                          name="pushNotifications"
                          type="checkbox"
                          checked={profileForm.pushNotifications}
                          onChange={handleProfileInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 rounded bg-white/10"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="pushNotifications" className="font-medium text-white">
                          Push Notifications
                        </label>
                        <p className="text-gray-300 text-sm mt-1">
                          Receive push notifications on your mobile device for price alerts and important updates.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center h-5">
                        <input
                          id="marketingEmails"
                          name="marketingEmails"
                          type="checkbox"
                          checked={profileForm.marketingEmails}
                          onChange={handleProfileInputChange}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-500 rounded bg-white/10"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="marketingEmails" className="font-medium text-white">
                          Marketing Emails
                        </label>
                        <p className="text-gray-300 text-sm mt-1">
                          Receive emails about new features, tips, and promotional offers.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="btn-primary px-6 py-3 text-sm font-medium"
                    >
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Application Preferences</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Timezone
                      </label>
                      <select
                        name="timezone"
                        value={profileForm.timezone}
                        onChange={handleProfileInputChange}
                        className="block w-full px-4 py-3 border border-gray-500/30 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      >
                        {timezones.map((tz) => (
                          <option key={tz.value} value={tz.value} className="bg-gray-800 text-white">
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Preferred Currency
                      </label>
                      <select
                        name="currency"
                        value={profileForm.currency}
                        onChange={handleProfileInputChange}
                        className="block w-full px-4 py-3 border border-gray-500/30 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code} className="bg-gray-800 text-white">
                            {currency.code} - {currency.name} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Language
                      </label>
                      <select
                        name="language"
                        value={profileForm.language}
                        onChange={handleProfileInputChange}
                        className="block w-full px-4 py-3 border border-gray-500/30 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code} className="bg-gray-800 text-white">
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="btn-primary px-6 py-3 text-sm font-medium"
                    >
                      {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
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

export default Profile;
