/**
 * Device Detection Module
 * Uses device-detector-js (port of matomo-org/device-detector) for accurate UA parsing
 * Falls back to basic regex patterns if library is unavailable
 */
import DeviceDetector from 'device-detector-js';

// Shared device detector instance
const detector = new DeviceDetector();

/**
 * Parse User-Agent string to extract detailed device information
 * @returns {Object} { browser, browser_version, os, os_version, device, device_brand, device_model, is_mobile, engine, engine_version }
 */
export function parseUserAgent(ua) {
  if (!ua) return getDefaultDeviceInfo();

  try {
    const result = detector.parse(ua);

    const browser = result.browser || {};
    const os = result.os || {};
    const device = result.device || {};
    const client = result.client || {};

    // Determine device type and brand
    const deviceType = device.type || 'desktop';
    const isMobile = (deviceType === 'smartphone' || deviceType === 'tablet') ? 1 : 0;

    // Get brand/model
    let brand = device.brand || '';
    let model = device.model || '';

    // Try to get more details from client
    let browserName = client.name || browser.name || '';
    let browserVersion = client.version || browser.version || '';
    let osName = os.name || '';
    let osVersion = os.version || '';

    // Clean up names for consistency
    if (!browserName && /Edg\//i.test(ua)) browserName = 'Edge';
    if (!browserName && /OPR\//i.test(ua)) browserName = 'Opera';

    return {
      browser: browserName || 'Unknown',
      browser_version: browserVersion || '',
      os: osName || 'Unknown',
      os_version: osVersion || '',
      device: mapDeviceType(deviceType),
      device_brand: brand || '',
      device_model: model || '',
      is_mobile: isMobile,
      engine: (result.engine || {}).name || '',
      engine_version: (result.engine || {}).version || '',
    };
  } catch (e) {
    // Fallback: basic parsing if library fails
    return basicParse(ua);
  }
}

/**
 * Map device-detector types to our types
 */
function mapDeviceType(type) {
  const typeMap = {
    'smartphone': 'smartphone',
    'tablet': 'tablet',
    'desktop': 'desktop',
    'smart_tv': 'smarttv',
    'tv': 'smarttv',
    'console': 'console',
    'car': 'desktop',
    'portable_media_player': 'desktop',
    'camera': 'desktop',
    'phablet': 'smartphone',
    'feature phone': 'smartphone',
    'unknown': 'unknown',
  };
  return typeMap[type] || 'desktop';
}

/**
 * Basic regex-based fallback parsing
 */
function basicParse(ua) {
  const result = {
    browser: 'Unknown', browser_version: '',
    os: 'Unknown', os_version: '',
    device: 'desktop', device_brand: '', device_model: '',
    is_mobile: 0, engine: '', engine_version: '',
  };

  // Browser detection
  const browserPatterns = [
    { name: 'Chrome', version: /Chrome\/([0-9.]+)/, pattern: /Chrome\//, exclude: [/Edg\//, /OPR\//, /SamsungBrowser\//] },
    { name: 'Safari', version: /Version\/([0-9.]+)/, pattern: /Safari\//, exclude: [/Chrome\//, /Edg\//, /OPR\//] },
    { name: 'Firefox', version: /Firefox\/([0-9.]+)/, pattern: /Firefox\// },
    { name: 'Edge', version: /Edg\/([0-9.]+)/, pattern: /Edg\// },
    { name: 'Opera', version: /OPR\/([0-9.]+)/, pattern: /OPR\// },
    { name: 'Samsung Browser', version: /SamsungBrowser\/([0-9.]+)/, pattern: /SamsungBrowser\// },
    { name: 'WeChat', version: /MicroMessenger\/([0-9.]+)/, pattern: /MicroMessenger/ },
  ];

  for (const b of browserPatterns) {
    if (b.pattern.test(ua) && !b.exclude?.some(e => e.test(ua))) {
      result.browser = b.name;
      if (b.version) { const m = ua.match(b.version); if (m) result.browser_version = m[1]; }
      break;
    }
  }

  // OS detection
  const osPatterns = [
    { name: 'Windows', version: /Windows NT ([0-9.]+)/, pattern: /Windows/ },
    { name: 'macOS', version: /Mac OS X ([0-9._]+)/, pattern: /Mac OS X/ },
    { name: 'iOS', version: /iPhone OS ([0-9._]+)/, pattern: /iPhone OS/ },
    { name: 'Android', version: /Android ([0-9.]+)/, pattern: /Android/ },
    { name: 'Linux', pattern: /Linux/ },
  ];

  for (const o of osPatterns) {
    if (o.pattern.test(ua)) {
      result.os = o.name;
      if (o.version) { const m = ua.match(o.version); if (m) result.os_version = m[1].replace(/_/g, '.'); }
      break;
    }
  }

  // Device detection
  if (/iPhone|Android.*Mobile/i.test(ua)) { result.device = 'smartphone'; result.is_mobile = 1; }
  else if (/iPad|Tablet|Kindle|Silk/i.test(ua)) { result.device = 'tablet'; result.is_mobile = 1; }

  return result;
}

function getDefaultDeviceInfo() {
  return {
    browser: 'Unknown', browser_version: '',
    os: 'Unknown', os_version: '',
    device: 'unknown', device_brand: '', device_model: '',
    is_mobile: 0, engine: '', engine_version: '',
  };
}