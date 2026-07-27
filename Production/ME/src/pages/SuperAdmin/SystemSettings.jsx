import React, { useEffect, useState } from 'react';
import { FiAlertTriangle, FiSave } from 'react-icons/fi';
import PageHeader from '../../components/superadmin/PageHeader';
import Card from '../../components/admin/Card';
import superAdminService from '../../services/superAdminService';
import useViewport from '../../hooks/useViewport';
import { useMaintenanceMode } from '../../context/MaintenanceContext';

const DEFAULT_MESSAGE =
  'Website is currently under maintenance.\nPlease try again later.';

const SystemSettings = () => {
  const { isMobile } = useViewport();
  const { refreshMaintenanceStatus } = useMaintenanceMode();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(DEFAULT_MESSAGE);
  const [supportPhone, setSupportPhone] = useState('');
  const [supportEmail, setSupportEmail] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const config = await superAdminService.getConfig();
        if (!mounted) return;
        setMaintenanceMode(Boolean(config?.maintenanceMode));
        setMaintenanceMessage(config?.maintenanceMessage || DEFAULT_MESSAGE);
        setSupportPhone(config?.supportPhone || '');
        setSupportEmail(config?.supportEmail || '');
      } catch (loadError) {
        if (!mounted) return;
        setError(loadError?.response?.data?.message || loadError.message || 'Failed to load platform settings');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await superAdminService.updateConfig({
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim() || DEFAULT_MESSAGE,
        supportPhone: supportPhone.trim(),
        supportEmail: supportEmail.trim(),
      });
      await refreshMaintenanceStatus();
      setSuccess(
        maintenanceMode
          ? 'Maintenance mode enabled. Write operations are now blocked.'
          : 'Maintenance mode disabled. Platform operations restored.'
      );
    } catch (saveError) {
      setError(saveError?.response?.data?.message || saveError.message || 'Failed to update platform settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
      <PageHeader
        title="System Settings"
        subtitle="Control platform-wide operational settings"
      />

      {loading ? (
        <p className="text-sm text-gray-500">Loading platform settings...</p>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <Card className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${maintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
            <FiAlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">Maintenance Mode</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pause write operations while keeping browsing, login, and registration available.
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maintenance-status"
                    checked={!maintenanceMode}
                    onChange={() => setMaintenanceMode(false)}
                  />
                  <span>Disabled</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="maintenance-status"
                    checked={maintenanceMode}
                    onChange={() => setMaintenanceMode(true)}
                  />
                  <span>Enabled</span>
                </label>
              </div>

              <div>
                <label htmlFor="maintenance-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance message
                </label>
                <textarea
                  id="maintenance-message"
                  rows={4}
                  value={maintenanceMessage}
                  onChange={(event) => setMaintenanceMessage(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={DEFAULT_MESSAGE}
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-[44px]"
              >
                <FiSave className="w-4 h-4" />
                {maintenanceMode ? 'Enable Maintenance Mode' : 'Disable Maintenance Mode'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Support Contact</h2>
        <p className="text-sm text-gray-500 mt-1">
          Phone number shown to vendors in the Support Center Call option.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="support-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Support Phone Number
            </label>
            <input
              id="support-phone"
              value={supportPhone}
              onChange={(event) => setSupportPhone(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div>
            <label htmlFor="support-email" className="block text-sm font-medium text-gray-700 mb-1">
              Support Email (optional)
            </label>
            <input
              id="support-email"
              value={supportEmail}
              onChange={(event) => setSupportEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              placeholder="support@example.com"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 min-h-[44px]"
        >
          <FiSave className="w-4 h-4" /> Save Support Settings
        </button>
      </Card>
    </div>
  );
};

export default SystemSettings;
