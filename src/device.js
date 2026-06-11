/**
 * Device Detection Module
 * Parses User-Agent strings to extract detailed device, browser, OS info
 * Uses a lightweight regex-based approach for Cloudflare Workers
 */

// Known device brands for better detection
const DEVICE_BRANDS = {
  'samsung': 'Samsung',
  'apple': 'Apple',
  'huawei': 'Huawei',
  'xiaomi': 'Xiaomi',
  'oppo': 'OPPO',
  'vivo': 'vivo',
  'oneplus': 'OnePlus',
  'google': 'Google',
  'lg': 'LG',
  'sony': 'Sony',
  'nokia': 'Nokia',
  'motorola': 'Motorola',
  'lenovo': 'Lenovo',
  'asus': 'ASUS',
  'acer': 'Acer',
  'dell': 'Dell',
  'hp': 'HP',
  'mi': 'Xiaomi',
  'redmi': 'Xiaomi',
  'realme': 'realme',
  'honor': 'Honor',
};

// OS detection patterns
const OS_PATTERNS = [
  { name: 'Windows', version: /Windows NT ([0-9.]+)/, pattern: /Windows/ },
  { name: 'macOS', version: /Mac OS X ([0-9._]+)/, pattern: /Mac OS X/ },
  { name: 'macOS', version: /Intel Mac OS X ([0-9._]+)/, pattern: /Intel Mac OS X/ },
  { name: 'iOS', version: /iPhone OS ([0-9._]+)/, pattern: /iPhone OS/ },
  { name: 'iOS', version: /iPad.*OS ([0-9._]+)/, pattern: /iPad/ },
  { name: 'Android', version: /Android ([0-9.]+)/, pattern: /Android/ },
  { name: 'Linux', pattern: /Linux/, version: null },
  { name: 'Ubuntu', pattern: /Ubuntu/, version: null },
  { name: 'Chrome OS', pattern: /CrOS/, version: null },
  { name: 'HarmonyOS', pattern: /HarmonyOS/, version: null },
];

// Browser detection patterns
const BROWSER_PATTERNS = [
  { name: 'Chrome', version: /Chrome\/([0-9.]+)/, pattern: /Chrome\//, exclude: [/Edg\//, /OPR\//, /SamsungBrowser\//] },
  { name: 'Safari', version: /Version\/([0-9.]+)/, pattern: /Safari\//, exclude: [/Chrome\//, /Edg\//, /OPR\//] },
  { name: 'Firefox', version: /Firefox\/([0-9.]+)/, pattern: /Firefox\// },
  { name: 'Edge', version: /Edg\/([0-9.]+)/, pattern: /Edg\// },
  { name: 'Opera', version: /OPR\/([0-9.]+)/, pattern: /OPR\// },
  { name: 'Opera', version: /Opera\/([0-9.]+)/, pattern: /Opera/ },
  { name: 'Samsung Internet', version: /SamsungBrowser\/([0-9.]+)/, pattern: /SamsungBrowser\// },
  { name: 'UC Browser', version: /UCBrowser\/([0-9.]+)/, pattern: /UCBrowser/ },
  { name: 'QQ Browser', version: /QQBrowser\/([0-9.]+)/, pattern: /QQBrowser/ },
  { name: 'WeChat', version: /MicroMessenger\/([0-9.]+)/, pattern: /MicroMessenger/ },
  { name: 'Baidu', version: /Baidu\/([0-9.]+)/, pattern: /Baidu/ },
  { name: 'IE', version: /MSIE ([0-9.]+)/, pattern: /MSIE/ },
  { name: 'IE', version: /Trident\/[0-9.]+.*rv:([0-9.]+)/, pattern: /Trident\// },
  { name: 'Brave', version: /Brave\/([0-9.]+)/, pattern: /Brave\// },
  { name: 'Vivaldi', version: /Vivaldi\/([0-9.]+)/, pattern: /Vivaldi\// },
];

// Device type detection
const DEVICE_PATTERNS = [
  { type: 'smartphone', patterns: [/iPhone/, /Android.*Mobile/, /Mobile.*Android/, /SAMSUNG.*Mobile/, /BlackBerry/, /IEMobile/, /Mobi/] },
  { type: 'tablet', patterns: [/iPad/, /Tablet/, /Android(?!.*Mobile)/, /Silk/, /Kindle/] },
  { type: 'desktop', patterns: [/Windows NT/, /Macintosh/, /Linux x86_64/, /CrOS/] },
  { type: 'smarttv', patterns: [/SmartTV/, /TV/, /AppleTV/, /GoogleTV/] },
  { type: 'console', patterns: [/PlayStation/, /Xbox/, /Nintendo/] },
  { type: 'wearable', patterns: [/Watch/, /Fitbit/] },
];

// ISP detection patterns from User-Agent
function detectISP(ua) {
  const ispPatterns = [
    { name: '中国电信', patterns: [/China Telecom/i, /CT/] },
    { name: '中国联通', patterns: [/China Unicom/i, /CU/] },
    { name: '中国移动', patterns: [/China Mobile/i, /CM/] },
    { name: '中国广电', patterns: [/CBN/i] },
  ];
  for (const isp of ispPatterns) {
    if (isp.patterns.some(p => p.test(ua))) return isp.name;
  }
  return '';
}

/**
 * Parse User-Agent string to extract detailed device information
 */
export function parseUserAgent(ua) {
  if (!ua) return getDefaultDeviceInfo();

  const result = {
    browser: '',
    browser_version: '',
    os: '',
    os_version: '',
    device: '',
    device_brand: '',
    device_model: '',
    is_mobile: 0,
    isp: '',
  };

  // Detect Browser
  for (const browser of BROWSER_PATTERNS) {
    if (browser.pattern.test(ua)) {
      const excluded = browser.exclude?.some(e => e.test(ua));
      if (!excluded) {
        result.browser = browser.name;
        if (browser.version) {
          const match = ua.match(browser.version);
          if (match) result.browser_version = match[1];
        }
        break;
      }
    }
  }

  // Detect OS
  for (const os of OS_PATTERNS) {
    if (os.pattern.test(ua)) {
      result.os = os.name;
      if (os.version) {
        const match = ua.match(os.version);
        if (match) result.os_version = match[1].replace(/_/g, '.');
      }
      break;
    }
  }

  // Detect device type
  for (const deviceType of DEVICE_PATTERNS) {
    if (deviceType.patterns.some(p => p.test(ua))) {
      result.device = deviceType.type;
      result.is_mobile = (deviceType.type === 'smartphone' || deviceType.type === 'tablet') ? 1 : 0;
      break;
    }
  }
  if (!result.device) result.device = 'unknown';

  // Detect device brand
  for (const [key, brand] of Object.entries(DEVICE_BRANDS)) {
    const brandRegex = new RegExp(key, 'i');
    if (brandRegex.test(ua)) {
      result.device_brand = brand;
      break;
    }
  }

  // Try to extract device model
  const modelPatterns = [
    /SM-[A-Z0-9]+/,
    /iPhone[0-9,]+/,
    /iPad[0-9,]+/,
    /MI [A-Z0-9]+/,
    /Redmi [A-Z0-9]+/,
    /Pixel [0-9]+/,
  ];
  for (const pattern of modelPatterns) {
    const match = ua.match(pattern);
    if (match) {
      result.device_model = match[0];
      break;
    }
  }

  // Detect ISP from UA
  result.isp = detectISP(ua);

  return result;
}

function getDefaultDeviceInfo() {
  return {
    browser: 'Unknown',
    browser_version: '',
    os: 'Unknown',
    os_version: '',
    device: 'unknown',
    device_brand: '',
    device_model: '',
    is_mobile: 0,
    isp: '',
  };
}