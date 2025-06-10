

import React, { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '../../types';

const initialSettings: UserSettings = {
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: false,
  theme: 'system', // Default to system
  dataRefreshInterval: 10,
  language: 'en',
};

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(initialSettings);

  const applyTheme = useCallback((themeToApply: UserSettings['theme']) => {
    const root = document.documentElement;
    console.log(`[applyTheme] Called with: ${themeToApply}. Current root classes: "${root.className}"`);
    if (themeToApply === 'dark') {
      root.classList.add('dark');
      console.log(`[applyTheme] Action: Added 'dark'. New root classes: "${root.className}"`);
    } else if (themeToApply === 'light') {
      root.classList.remove('dark');
      console.log(`[applyTheme] Action: Removed 'dark'. New root classes: "${root.className}"`);
    } else { // System
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
        console.log(`[applyTheme] Action (system detected dark): Added 'dark'. New root classes: "${root.className}"`);
      } else {
        root.classList.remove('dark');
        console.log(`[applyTheme] Action (system detected light): Removed 'dark'. New root classes: "${root.className}"`);
      }
    }
    localStorage.setItem('app-theme', themeToApply);
  }, []);


  useEffect(() => {
    let currentThemePreference: UserSettings['theme'];
    const storedSettingsString = localStorage.getItem('user-settings');

    if (storedSettingsString) {
      const parsedSettings = JSON.parse(storedSettingsString) as UserSettings;
      setSettings(parsedSettings);
      currentThemePreference = parsedSettings.theme;
    } else {
      currentThemePreference = (localStorage.getItem('app-theme') as UserSettings['theme']) || 'system';
      setSettings(prev => ({ ...prev, theme: currentThemePreference }));
    }
    applyTheme(currentThemePreference);

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Check the theme preference from localStorage directly, not component state,
      // as state might not have updated if the component isn't focused or re-rendered.
      if (localStorage.getItem('app-theme') === 'system') {
        console.log('[SettingsPage] System theme change detected.');
        if (e.matches) {
          document.documentElement.classList.add('dark');
          console.log('[SettingsPage] System applied dark theme.');
        } else {
          document.documentElement.classList.remove('dark');
          console.log('[SettingsPage] System applied light theme.');
        }
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [applyTheme]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let newSettingsValue: string | number | boolean;

    if (type === 'checkbox') {
      newSettingsValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'dataRefreshInterval') {
      newSettingsValue = parseInt(value, 10);
    } else {
      newSettingsValue = value;
    }

    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, [name]: newSettingsValue as any };
      
      if (name === 'theme') {
        applyTheme(updatedSettings.theme); // Apply theme immediately on change
        console.log("[SettingsPage] Theme dropdown changed to:", updatedSettings.theme);
      } else if (name === 'language') {
        console.log("[SettingsPage] Language selection changed to:", updatedSettings.language);
      } else if (name === 'notificationsEnabled' || name === 'emailNotifications' || name === 'pushNotifications') {
        console.log(`[SettingsPage] Notification setting '${name}' changed to:`, updatedSettings[name as keyof UserSettings]);
      } else if (name === 'dataRefreshInterval') {
        console.log("[SettingsPage] Data refresh interval changed to:", updatedSettings.dataRefreshInterval, "minutes");
      }
      return updatedSettings;
    });
  };

  const handleSaveSettings = () => {
    const mostRecentAppliedTheme = (localStorage.getItem('app-theme') as UserSettings['theme']) || settings.theme;

    const finalSettingsToSave: UserSettings = {
      ...settings, 
      theme: mostRecentAppliedTheme, 
    };
    
    console.log('[SettingsPage] Saving final settings:', finalSettingsToSave);
    localStorage.setItem('user-settings', JSON.stringify(finalSettingsToSave));
    localStorage.setItem('app-theme', finalSettingsToSave.theme); 
    
    applyTheme(finalSettingsToSave.theme); 
    
    alert('Settings saved! Check console for details.');
  };
  
  const themeOptions: { value: UserSettings['theme']; label: string }[] = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' },
  ];

  const refreshIntervalOptions: { value: UserSettings['dataRefreshInterval']; label: string }[] = [
    { value: 5, label: 'Every 5 minutes' },
    { value: 10, label: 'Every 10 minutes' },
    { value: 15, label: 'Every 15 minutes' },
    { value: 30, label: 'Every 30 minutes' },
  ];

  const languageOptions: { value: UserSettings['language']; label: string }[] = [
    { value: 'en', label: 'English (US)' },
    { value: 'es', label: 'Español (Coming Soon)' },
    { value: 'fr', label: 'Français (Coming Soon)' },
  ];

  const ToggleSwitch: React.FC<{
    label: string;
    name: keyof UserSettings;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    description?: string;
  }> = ({ label, name, checked, onChange, disabled = false, description }) => (
    <div className="py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <label htmlFor={name} className={`text-sm font-medium ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'} mr-4`}>
          {label}
          {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
                type="checkbox"
                name={name}
                id={name}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className={`toggle-checkbox absolute block w-6 h-6 rounded-full bg-white dark:bg-gray-500 border-4 appearance-none cursor-pointer transition-all duration-200 ease-in ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            ${checked ? 'right-0 border-red-500 dark:border-red-400' : 'left-0 border-gray-300 dark:border-gray-600'}`}
            />
            <label
                htmlFor={name}
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in ${disabled ? 'bg-gray-200 dark:bg-gray-700' : (checked ? 'bg-red-500 dark:bg-red-400' : 'bg-gray-300 dark:bg-gray-600')}`}
            ></label>
        </div>
      </div>
    </div>
  );

  const SelectInput: React.FC<{
    label: string;
    name: keyof UserSettings;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    options: { value: string | number; label: string }[];
    disabled?: boolean;
    description?: string;
  }> = ({ label, name, value, onChange, options, disabled = false, description }) => (
     <div className="py-3 sm:py-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 -mt-0.5">{description}</p>}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
                    focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500 focus:border-red-400 dark:focus:border-red-500 outline-none 
                    transition-colors text-sm text-gray-700 dark:text-gray-200 
                    ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400' : ''}`}
        aria-label={label}
      >
        {options.map(opt => (
          <option key={opt.value.toString()} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );


  return (
    <div className="p-6 space-y-8 flex-1 bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Application Settings</h1>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 border-b dark:border-gray-700 pb-3">Notifications</h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
           <ToggleSwitch
            label="Enable All Notifications"
            name="notificationsEnabled"
            checked={settings.notificationsEnabled}
            onChange={handleInputChange}
            description="Master control for all app notifications."
          />
          <ToggleSwitch
            label="Email Notifications"
            name="emailNotifications"
            checked={settings.emailNotifications}
            onChange={handleInputChange}
            disabled={!settings.notificationsEnabled}
            description="Receive important updates via email."
          />
          <ToggleSwitch
            label="Push Notifications"
            name="pushNotifications"
            checked={settings.pushNotifications}
            onChange={handleInputChange}
            disabled={!settings.notificationsEnabled}
            description="Get real-time alerts on your device (requires app support)."
          />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-3">Appearance</h2>
        <SelectInput
          label="Application Theme"
          name="theme"
          value={settings.theme}
          onChange={handleInputChange}
          options={themeOptions}
          description="Choose your preferred visual theme."
        />
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-3">Data & Synchronization</h2>
        <SelectInput
          label="Data Refresh Interval"
          name="dataRefreshInterval"
          value={settings.dataRefreshInterval}
          onChange={handleInputChange}
          options={refreshIntervalOptions}
          description="How often the dashboard data should automatically update."
        />
      </section>

      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-3">Language & Region</h2>
        <SelectInput
          label="Display Language"
          name="language"
          value={settings.language}
          onChange={handleInputChange}
          options={languageOptions}
          description="Select your preferred language for the application interface."
        />
      </section>
      
      <div className="flex justify-end mt-8">
        <button
          type="button"
          onClick={handleSaveSettings}
          className="px-8 py-3 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:outline-none transition-colors"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
