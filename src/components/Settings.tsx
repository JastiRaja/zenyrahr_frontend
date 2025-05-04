import React, { useState } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, User, X, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    twoFactorAuth: false,
    language: 'en',
  });

  const handleSettingChange = (setting: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors duration-200"
      >
        <SettingsIcon className="h-6 w-6 text-black hover:text-gray-600" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="settings-modal">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)} />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                      ) : (
                        <Sun className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                      )}
                      <span className="ml-3 text-gray-900 dark:text-white">Dark Mode</span>
                    </div>
                    <button
                      onClick={toggleTheme}
                      className={`${
                        theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                      />
                    </button>
                  </div>

                  {/* Notifications */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Notifications</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Bell className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                          <span className="ml-3 text-gray-700 dark:text-gray-300">Push Notifications</span>
                        </div>
                        <button
                          onClick={() => handleSettingChange('notifications', !settings.notifications)}
                          className={`${
                            settings.notifications ? 'bg-indigo-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              settings.notifications ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Mail className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                          <span className="ml-3 text-gray-700 dark:text-gray-300">Email Notifications</span>
                        </div>
                        <button
                          onClick={() => handleSettingChange('emailNotifications', !settings.emailNotifications)}
                          className={`${
                            settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                        >
                          <span
                            className={`${
                              settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Security</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Shield className="h-5 w-5 text-gray-400 dark:text-gray-300" />
                        <span className="ml-3 text-gray-700 dark:text-gray-300">Two-Factor Authentication</span>
                      </div>
                      <button
                        onClick={() => handleSettingChange('twoFactorAuth', !settings.twoFactorAuth)}
                        className={`${
                          settings.twoFactorAuth ? 'bg-indigo-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                      >
                        <span
                          className={`${
                            settings.twoFactorAuth ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Language</h4>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}