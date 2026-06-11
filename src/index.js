import { handleTrack } from './track';
import { handleApi } from './api';
import { serveDashboard } from './static';
import { parseUserAgent } from './device';
import { getLocationFromRequest } from './geo';
import { insertPageview, ensureSite } from './db';

// Main entry point for Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: Tracking script (GET /script.js)
      if (path === '/script.js' || path === '/track.js') {
        return handleTrackingScript(env, corsHeaders);
      }

      // Route: Tracking beacon (POST /track)
      if (path === '/track') {
        if (method === 'POST') {
          return await handleTrack(request, env, corsHeaders);
        }
        // GET /track - return a 1x1 pixel for img-based tracking fallback
        return serveTrackingPixel(corsHeaders);
      }

      // Route: API endpoints (GET /api/*)
      if (path.startsWith('/api/')) {
        return await handleApi(request, env, corsHeaders);
      }

      // ===== ALL OTHER GET REQUESTS =====
      // Track the dashboard visit itself and serve dashboard
      // This ensures direct visits to the worker URL are also recorded
      if (method === 'GET') {
        // Track this visit asynchronously (don't await - fire and forget)
        ctx.waitUntil(trackDashboardVisit(request, env));

        // Serve dashboard HTML
        return await serveDashboard(request, env, corsHeaders);
      }

      // Fallback: 405 Method Not Allowed
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error) {
      console.error('HanAnalytics Error:', error.message);
      // Still serve dashboard on error (graceful degradation)
      try {
        const html = await serveDashboard(request, env, corsHeaders);
        return html;
      } catch {
        return new Response(JSON.stringify({
          error: 'Internal error',
          detail: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }
  },
};

/**
 * Track dashboard visits (direct visits to the analytics service itself)
 * This records the visit as a pageview in the database.
 */
async function trackDashboardVisit(request, env) {
  try {
    const userAgent = request.headers.get('User-Agent') || 'Unknown';
    const deviceInfo = parseUserAgent(userAgent);
    const location = await getLocationFromRequest(request);

    const clientIP = request.headers.get('CF-Connecting-IP') ||
                     request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                     '127.0.0.1';

    // Simple hash for privacy
    let hash = 0;
    for (let i = 0; i < clientIP.length; i++) {
      const char = clientIP.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const ipHash = 'v_' + Math.abs(hash).toString(36).substring(0, 8);

    const record = {
      website_id: 'dashboard',
      ip: clientIP,
      url: request.url,
      referrer: request.headers.get('Referer') || '',
      screen_size: '',
      timestamp: Date.now(),
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
      lang: request.headers.get('Accept-Language')?.split(',')[0] || '',
    };

    await ensureSite(env, 'dashboard');
    await insertPageview(env, record);
  } catch (e) {
    // Silently fail - tracking should never break the dashboard
    console.error('Dashboard visit tracking error:', e.message);
  }
}

/**
 * Serve tracking script for embedding in external websites
 */
function handleTrackingScript(env, corsHeaders) {
  const script = `
(function() {
  try {
    var script = document.currentScript;
    var websiteId = 'unknown';

    if (script) {
      websiteId = script.getAttribute('data-website-id') || location.hostname.replace(/\\./g, '-');
    } else {
      websiteId = location.hostname.replace(/\\./g, '-');
    }

    // Determine the analytics server URL
    var siteUrl = '${env.SITE_URL || ''}';
    if (!siteUrl && script) {
      var src = script.src;
      siteUrl = src.substring(0, src.lastIndexOf('/'));
    }
    if (!siteUrl) {
      siteUrl = location.protocol + '//' + location.hostname;
    }

    function sendBeacon(data) {
      var payload = JSON.stringify(data);
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(siteUrl + '/track', payload);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', siteUrl + '/track', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(payload);
        }
      } catch(e) {
        // Fallback: use fetch if available
        if (typeof fetch !== 'undefined') {
          fetch(siteUrl + '/track', { method: 'POST', headers: {'Content-Type':'application/json'}, body: payload, keepalive: true }).catch(function(){});
        }
      }
    }

    function collectData() {
      sendBeacon({
        website_id: websiteId,
        url: window.location.href,
        referrer: document.referrer || '',
        screen_size: (screen.width || 0) + 'x' + (screen.height || 0),
        lang: navigator.language || navigator.userLanguage || '',
        user_agent: navigator.userAgent || '',
        timestamp: Date.now()
      });
    }

    if (document.readyState === 'complete') {
      setTimeout(collectData, 100);
    } else {
      window.addEventListener('load', collectData);
    }
  } catch(e) {
    console.error('HanAnalytics error:', e);
  }
})();
`;
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
      ...corsHeaders,
    },
  });
}

/**
 * Serve a 1x1 transparent GIF for image-based tracking fallback
 */
function serveTrackingPixel(corsHeaders) {
  // Minimal 1x1 transparent GIF
  const pixel = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
    0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
    0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00,
    0x00, 0x21, 0xF9, 0x04, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
    0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00, 0x02, 0x02, 0x44, 0x01, 0x00,
    0x3B
  ]);
  return new Response(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...corsHeaders,
    },
  });
}