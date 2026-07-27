import PlatformSettings from './platformSettings.model.js';
import { fetchSetting, updateSetting } from '../settings/settings.service.js';

const DEFAULT_MAINTENANCE_MESSAGE =
  'The platform is currently under maintenance. Please try again later.';

let cachedSettings = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 5000;

function normalizeSettings(doc) {
  return {
    maintenanceMode: Boolean(doc?.maintenanceMode),
    maintenanceMessage:
      doc?.maintenanceMessage?.trim() || DEFAULT_MAINTENANCE_MESSAGE,
    supportPhone: doc?.supportPhone?.trim() || '',
    supportEmail: doc?.supportEmail?.trim() || '',
    updatedBy: doc?.updatedBy || null,
    updatedAt: doc?.updatedAt || null,
  };
}

async function hydrateFromLegacySettings() {
  const maintenance = await fetchSetting('maintenanceMode');
  const maintenanceOld = await fetchSetting('MAINTENANCE_MODE');
  const enabled = maintenance?.value === true || maintenanceOld?.value === true;

  if (!enabled) {
    return null;
  }

  return {
    maintenanceMode: true,
    maintenanceMessage: DEFAULT_MAINTENANCE_MESSAGE,
  };
}

export async function getPlatformSettings({ bypassCache = false } = {}) {
  const now = Date.now();
  if (!bypassCache && cachedSettings && cacheExpiresAt > now) {
    return cachedSettings;
  }

  let doc = await PlatformSettings.findOne({ singletonKey: 'platform' });

  if (!doc) {
    const legacy = await hydrateFromLegacySettings();
    doc = await PlatformSettings.create({
      singletonKey: 'platform',
      maintenanceMode: legacy?.maintenanceMode || false,
      maintenanceMessage: legacy?.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE,
    });
  } else {
    const legacy = await hydrateFromLegacySettings();
    if (legacy?.maintenanceMode && !doc.maintenanceMode) {
      doc.maintenanceMode = true;
      await doc.save();
    }
  }

  cachedSettings = normalizeSettings(doc);
  cacheExpiresAt = now + CACHE_TTL_MS;
  return cachedSettings;
}

export async function updatePlatformSettings(updates = {}, userId = null) {
  const payload = {};

  if (typeof updates.maintenanceMode === 'boolean') {
    payload.maintenanceMode = updates.maintenanceMode;
    await updateSetting('maintenanceMode', updates.maintenanceMode);
    await updateSetting('MAINTENANCE_MODE', updates.maintenanceMode);
  }

  if (typeof updates.maintenanceMessage === 'string') {
    payload.maintenanceMessage = updates.maintenanceMessage.trim();
  }

  if (typeof updates.supportPhone === 'string') {
    payload.supportPhone = updates.supportPhone.trim();
  }

  if (typeof updates.supportEmail === 'string') {
    payload.supportEmail = updates.supportEmail.trim();
  }

  if (userId) {
    payload.updatedBy = userId;
  }

  const doc = await PlatformSettings.findOneAndUpdate(
    { singletonKey: 'platform' },
    { $set: payload, $setOnInsert: { singletonKey: 'platform' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  cachedSettings = normalizeSettings(doc);
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return cachedSettings;
}

export async function isMaintenanceModeEnabled() {
  const settings = await getPlatformSettings();
  return settings.maintenanceMode === true;
}

export function getDefaultMaintenanceMessage() {
  return DEFAULT_MAINTENANCE_MESSAGE;
}
