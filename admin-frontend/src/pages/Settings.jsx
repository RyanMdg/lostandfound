import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await adminAPI.getSettings();
      // Convert array of settings to object for easier handling
      const settingsObj = {};
      data.forEach((setting) => {
        settingsObj[setting.settingKey] = setting.settingValue;
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Convert settings object back to array format
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      await adminAPI.updateSettings({ settings: settingsArray });
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Failed to save settings',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-600 mt-1">Configure global system preferences</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="card space-y-6">
        {/* Hold Period */}
        <div>
          <label htmlFor="hold_period" className="block text-sm font-medium text-gray-700 mb-2">
            Default Hold Period (Days)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Number of days an item is placed on hold before being archived
          </p>
          <input
            id="hold_period"
            type="number"
            min="1"
            max="365"
            value={settings.hold_period_days || 7}
            onChange={(e) => handleChange('hold_period_days', e.target.value)}
            className="input-field max-w-xs"
          />
        </div>

        {/* Blur Level */}
        <div>
          <label htmlFor="blur_level" className="block text-sm font-medium text-gray-700 mb-2">
            Image Blur Level
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Blur intensity for published found item images (for security)
          </p>
          <select
            id="blur_level"
            value={settings.blur_level || 'medium'}
            onChange={(e) => handleChange('blur_level', e.target.value)}
            className="input-field max-w-xs"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {/* Admin Email */}
        <div>
          <label htmlFor="admin_email" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Contact Email
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Primary email address for admin notifications and contact
          </p>
          <input
            id="admin_email"
            type="email"
            value={settings.admin_email || ''}
            onChange={(e) => handleChange('admin_email', e.target.value)}
            className="input-field max-w-md"
            placeholder="admin@school.edu"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">About Hold Period</h3>
          <p className="text-sm text-blue-800">
            When a claim is placed on hold, the item will be reserved for the specified number
            of days. After this period, if no further action is taken, the item may be archived
            or returned to available status.
          </p>
        </div>

        <div className="card bg-green-50 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">About Blur Level</h3>
          <p className="text-sm text-green-800">
            Blurring item images helps protect against fraudulent claims. Higher blur levels
            make it harder to identify specific details, requiring claimants to provide more
            specific verification information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
