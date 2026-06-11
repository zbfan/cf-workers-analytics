/**
 * IP Geolocation Module
 * Uses ip9.com.cn API for accurate Chinese IP geolocation
 * Falls back to Cloudflare CF headers when API is unavailable
 */

// Country name Chinese translation (for non-CN IPs)
const COUNTRY_CN = {
  'CN': '中国', 'US': '美国', 'JP': '日本', 'KR': '韩国',
  'GB': '英国', 'DE': '德国', 'FR': '法国', 'CA': '加拿大',
  'AU': '澳大利亚', 'SG': '新加坡', 'HK': '中国香港', 'TW': '中国台湾',
  'MO': '中国澳门', 'RU': '俄罗斯', 'IN': '印度', 'BR': '巴西',
  'IT': '意大利', 'ES': '西班牙', 'NL': '荷兰', 'SE': '瑞典',
  'NO': '挪威', 'FI': '芬兰', 'DK': '丹麦', 'CH': '瑞士',
  'AT': '奥地利', 'BE': '比利时', 'IE': '爱尔兰', 'NZ': '新西兰',
  'ZA': '南非', 'MX': '墨西哥', 'AR': '阿根廷', 'TH': '泰国',
  'VN': '越南', 'MY': '马来西亚', 'PH': '菲律宾', 'ID': '印度尼西亚',
  'AE': '阿联酋', 'SA': '沙特阿拉伯', 'IL': '以色列', 'EG': '埃及',
  'NG': '尼日利亚',
};

/**
 * Get country display name in Chinese
 */
export function getCountryName(countryCode) {
  if (!countryCode) return '未知';
  // If it's already a Chinese name, return as is
  if (/[\u4e00-\u9fff]/.test(countryCode)) return countryCode;
  return COUNTRY_CN[countryCode.toUpperCase()] || countryCode;
}

/**
 * Get IP geolocation from ip9.com.cn API
 * Returns detailed location data including prov, city, area, isp
 */
async function queryIPGeolocation(ip) {
  if (!ip || ip === '127.0.0.1' || ip === 'localhost') {
    return null;
  }

  try {
    const url = `https://ip9.com.cn/get?ip=${encodeURIComponent(ip)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.ret === 200 && data.data) {
      return data.data;
    }
    return null;
  } catch (e) {
    console.error('ip9 API error:', e.message);
    return null;
  }
}

/**
 * Get detailed location info
 * First tries ip9.com.cn API, falls back to Cloudflare headers
 */
export async function getLocationFromRequest(request) {
  const cf = request.cf || {};

  // Get client IP
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                   request.headers.get('X-Real-IP') ||
                   '';

  // Try ip9.com.cn API first
  const apiData = await queryIPGeolocation(clientIP);

  if (apiData) {
    return {
      country: apiData.country || '',
      country_code: (apiData.country_code || '').toLowerCase(),
      region: apiData.prov || '',
      city: apiData.city || '',
      area: apiData.area || '',
      big_area: apiData.big_area || '',
      isp: apiData.isp || '',
      lng: apiData.lng || '',
      lat: apiData.lat || '',
      source: 'ip9',
    };
  }

  // Fallback to Cloudflare headers
  let country = cf.country || '';
  let region = cf.region || '';
  let city = cf.city || '';

  return {
    country: getCountryName(country),
    country_code: country.toLowerCase(),
    region,
    city,
    area: '',
    big_area: '',
    isp: cf.asOrganization || '',
    lng: '',
    lat: '',
    source: 'cf',
  };
}

/**
 * Get Chinese display string for location summary
 */
export function getLocationDisplay(geo) {
  if (!geo) return '未知位置';
  const parts = [];
  if (geo.big_area) parts.push(geo.big_area);
  if (geo.region) parts.push(geo.region);
  if (geo.city) parts.push(geo.city);
  if (geo.area) parts.push(geo.area);
  if (parts.length === 0 && geo.country) parts.push(geo.country);
  return parts.filter(Boolean).join(' ') || '未知位置';
}