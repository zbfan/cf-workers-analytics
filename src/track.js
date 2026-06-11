/**
 * Tracking Endpoint Handler
 * Processes incoming tracking beacons and stores data in D1
 */
import { parseUserAgent } from './device';
import { getLocationFromRequest } from './geo';
import { insertPageview, ensureSite } from './db';

/**
 * Hash an IP address (privacy preservation)
 */
function hashIP(ip) {
  if (!ip) return '';
  // Simple hash for privacy - use SHA-256 in production
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'v_' + Math.abs(hash).toString(36).substring(0, 8);
}

/**
 * Get client IP from request
 */
function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
         request.headers.get('X-Real-IP') ||
         '127.0.0.1';
}

/**
 * Handle tracking POST request
 */
export async function handleTrack(request, env, corsHeaders) {
  try {
    let data;
    const contentType = request.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('text/plain')) {
      const text = await request.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    } else {
      const formData = await request.formData();
      data = Object.fromEntries(formData.entries());
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Invalid data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Parse User-Agent (兼容无 user_agent 的情况)
    const userAgent = data.user_agent || request.headers.get('User-Agent') || 'Unknown';
    const deviceInfo = parseUserAgent(userAgent);
    
    // Get location from ip9.com.cn API (with Cloudflare fallback)
    const location = await getLocationFromRequest(request);
    
    // Get client IP
    const clientIP = getClientIP(request);
    const ipHash = hashIP(clientIP);

    // Prepare data for storage
    const record = {
      website_id: data.website_id || 'default',
      ip: clientIP,
      url: data.url || '',
      referrer: data.referrer || '',
      screen_size: data.screen_size || '',
      timestamp: data.timestamp || Date.now(),
      ip_hash: ipHash,
      country: location.country,
      country_code: location.country_code,
      region: location.region,
      city: location.city,
      area: location.area,
      big_area: location.big_area,
      isp: location.isp || deviceInfo.isp,
      lng: location.lng,
      lat: location.lat,
      browser: deviceInfo.browser,
      browser_version: deviceInfo.browser_version,
      os: deviceInfo.os,
      os_version: deviceInfo.os_version,
      device: deviceInfo.device,
      device_brand: deviceInfo.device_brand,
      device_model: deviceInfo.device_model,
      is_mobile: deviceInfo.is_mobile,
      lang: data.lang || '',
    };

    // Store in database
    await ensureSite(env, record.website_id);
    await insertPageview(env, record);

    // Return success
    return new Response(JSON.stringify({ 
      success: true, 
      id: ipHash.substring(0, 8) 
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Track error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}