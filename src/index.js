import { handleTrack } from './track';
import { handleApi } from './api';
import { serveDashboard } from './static';

// Main entry point for Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route: Tracking script injection (GET /script.js or /track.js)
      if (path === '/script.js' || path === '/track.js') {
        return handleTrackingScript(env, corsHeaders);
      }

      // Route: Tracking beacon (POST /track)
      if (path === '/track' && request.method === 'POST') {
        return await handleTrack(request, env, corsHeaders);
      }

      // Route: API endpoints
      if (path.startsWith('/api/')) {
        return await handleApi(request, env, corsHeaders);
      }

      // Route: Dashboard
      return await serveDashboard(request, env, corsHeaders);
    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

// Serve tracking script for embedding
function handleTrackingScript(env, corsHeaders) {
  const script = `
(function() {
  var script = document.currentScript;
  var websiteId = script.getAttribute('data-website-id') || 'default';
  var siteUrl = script.src.substring(0, script.src.lastIndexOf('/')) || '${env.SITE_URL || ''}';

  function sendBeacon(data) {
    var payload = JSON.stringify(data);
    // Use sendBeacon if available
    if (navigator.sendBeacon) {
      navigator.sendBeacon(siteUrl + '/track', payload);
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', siteUrl + '/track', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(payload);
    }
  }

  function collectData() {
    var data = {
      website_id: websiteId,
      url: window.location.href,
      referrer: document.referrer || '',
      screen_size: screen.width + 'x' + screen.height,
      lang: navigator.language || navigator.userLanguage || '',
      user_agent: navigator.userAgent,
      timestamp: Date.now()
    };
    sendBeacon(data);
  }

  if (document.readyState === 'complete') {
    collectData();
  } else {
    window.addEventListener('load', collectData);
  }
})();
`;
  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=86400',
      ...corsHeaders,
    },
  });
}