/**
 * IP Geolocation Module
 * Uses Cloudflare's CF-IPCountry header and provides Chinese geolocation display
 * Falls back to IP-API.com for detailed location data
 */

// Chinese region names mapping
const CHINA_REGIONS = {
  'Beijing': '北京市',
  'Shanghai': '上海市',
  'Tianjin': '天津市',
  'Chongqing': '重庆市',
  'Guangdong': '广东省',
  'Fujian': '福建省',
  'Zhejiang': '浙江省',
  'Jiangsu': '江苏省',
  'Shandong': '山东省',
  'Sichuan': '四川省',
  'Hubei': '湖北省',
  'Hunan': '湖南省',
  'Henan': '河南省',
  'Hebei': '河北省',
  'Anhui': '安徽省',
  'Jiangxi': '江西省',
  'Shaanxi': '陕西省',
  'Shanxi': '山西省',
  'Liaoning': '辽宁省',
  'Jilin': '吉林省',
  'Heilongjiang': '黑龙江省',
  'Yunnan': '云南省',
  'Guizhou': '贵州省',
  'Guangxi': '广西壮族自治区',
  'Neimenggu': '内蒙古自治区',
  'Ningxia': '宁夏回族自治区',
  'Xinjiang': '新疆维吾尔自治区',
  'Xizang': '西藏自治区',
  'Qinghai': '青海省',
  'Gansu': '甘肃省',
  'Hainan': '海南省',
  'Macau': '澳门特别行政区',
  'Hongkong': '香港特别行政区',
  'Taiwan': '台湾省',
};

// Country name Chinese translation
const COUNTRY_CN = {
  'CN': '中国',
  'US': '美国',
  'JP': '日本',
  'KR': '韩国',
  'GB': '英国',
  'DE': '德国',
  'FR': '法国',
  'CA': '加拿大',
  'AU': '澳大利亚',
  'SG': '新加坡',
  'HK': '中国香港',
  'TW': '中国台湾',
  'MO': '中国澳门',
  'RU': '俄罗斯',
  'IN': '印度',
  'BR': '巴西',
  'IT': '意大利',
  'ES': '西班牙',
  'NL': '荷兰',
  'SE': '瑞典',
  'NO': '挪威',
  'FI': '芬兰',
  'DK': '丹麦',
  'CH': '瑞士',
  'AT': '奥地利',
  'BE': '比利时',
  'IE': '爱尔兰',
  'NZ': '新西兰',
  'ZA': '南非',
  'MX': '墨西哥',
  'AR': '阿根廷',
  'CL': '智利',
  'CO': '哥伦比亚',
  'PT': '葡萄牙',
  'PL': '波兰',
  'TR': '土耳其',
  'TH': '泰国',
  'VN': '越南',
  'MY': '马来西亚',
  'PH': '菲律宾',
  'ID': '印度尼西亚',
  'AE': '阿联酋',
  'SA': '沙特阿拉伯',
  'IL': '以色列',
  'EG': '埃及',
  'NG': '尼日利亚',
  'KE': '肯尼亚',
};

/**
 * Get country display name in Chinese
 */
export function getCountryName(countryCode) {
  if (!countryCode) return '未知';
  return COUNTRY_CN[countryCode] || countryCode;
}

/**
 * Get region display name in Chinese (for China)
 */
export function getRegionName(region) {
  if (!region) return '';
  return CHINA_REGIONS[region] || region;
}

/**
 * Get detailed location info from Cloudflare request
 * Uses Cloudflare's geolocation headers
 */
export function getLocationFromRequest(request) {
  const cf = request.cf || {};
  
  let country = cf.country || '';
  let region = cf.region || '';
  let city = cf.city || '';
  let isp = ''; // ISP not directly available from CF

  // Map region names to Chinese for display
  if (country === 'CN') {
    region = getRegionName(region);
    city = city || '';
  }

  // Get ISP from cf headers if available
  isp = cf.asOrganization || '';

  return { country, region, city, isp };
}

/**
 * Get Chinese display string for location
 */
export function getLocationDisplay(country, region, city) {
  const parts = [];
  const countryCn = getCountryName(country);
  
  if (country === 'CN') {
    if (region) parts.push(region);
    if (city) parts.push(city);
    if (parts.length === 0) parts.push('中国');
  } else {
    parts.push(countryCn);
  }
  
  return parts.filter(Boolean).join(' ') || '未知位置';
}