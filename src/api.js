/**
 * API Endpoints Handler
 * Provides all data endpoints for the dashboard
 */
import {
  getTotalPageviews,
  getUniqueVisitors,
  getTimeStats,
  getDistribution,
  getRecentPageviews,
  getSites,
  exportData,
} from './db';
import { getCountryName } from './geo';

export async function handleApi(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');
  const method = request.method;
  
  // Parse query parameters
  const websiteId = url.searchParams.get('website_id') || 'default';
  const period = url.searchParams.get('period') || '7d';
  const since = getSinceTimestamp(period);

  // Route: GET /api/overview - Traffic overview
  if (path === 'overview' && method === 'GET') {
    return await getOverview(env, websiteId, since, corsHeaders);
  }

  // Route: GET /api/timeseries - Time-based stats
  if (path === 'timeseries' && method === 'GET') {
    const groupBy = url.searchParams.get('groupBy') || 'hour';
    return await getTimeSeriesData(env, websiteId, since, groupBy, corsHeaders);
  }

  // Route: GET /api/browsers - Browser distribution
  if (path === 'browsers' && method === 'GET') {
    return await getDistData(env, websiteId, 'browser', since, corsHeaders);
  }

  // Route: GET /api/os - OS distribution
  if (path === 'os' && method === 'GET') {
    return await getDistData(env, websiteId, 'os', since, corsHeaders);
  }

  // Route: GET /api/devices - Device distribution
  if (path === 'devices' && method === 'GET') {
    return await getDistData(env, websiteId, 'device', since, corsHeaders);
  }

  // Route: GET /api/countries - Country distribution
  if (path === 'countries' && method === 'GET') {
    return await getCountryData(env, websiteId, since, corsHeaders);
  }

  // Route: GET /api/regions - Region/Area distribution
  if (path === 'regions' && method === 'GET') {
    return await getDistData(env, websiteId, 'region', since, corsHeaders, 20);
  }

  // Route: GET /api/areas - District/Area distribution
  if (path === 'areas' && method === 'GET') {
    return await getDistData(env, websiteId, 'area', since, corsHeaders, 20);
  }

  // Route: GET /api/apps - App/Referrer distribution
  if (path === 'apps' && method === 'GET') {
    return await getDistData(env, websiteId, 'referrer', since, corsHeaders);
  }

  // Route: GET /api/networks - ISP distribution
  if (path === 'networks' && method === 'GET') {
    return await getDistData(env, websiteId, 'isp', since, corsHeaders);
  }

  // Route: GET /api/recent - Recent visits
  if (path === 'recent' && method === 'GET') {
    return await getRecent(env, websiteId, corsHeaders);
  }

  // Route: GET /api/history - Visit history with search & pagination
  if (path === 'history' && method === 'GET') {
    const q = url.searchParams.get('q') || '';
    const date = url.searchParams.get('date') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    return await getHistory(env, websiteId, q, date, page, pageSize, corsHeaders);
  }

  // Route: GET /api/sites - List all sites
  if (path === 'sites' && method === 'GET') {
    return await getAllSites(env, corsHeaders);
  }

  // Route: GET /api/export - Export data
  if (path === 'export' && method === 'GET') {
    return await handleExport(env, websiteId, corsHeaders);
  }

  // Route: GET /api/version - Version info
  if (path === 'version' && method === 'GET') {
    return new Response(JSON.stringify({
      version: env.VERSION || '1.0.0',
      name: 'HanAnalytics',
      built: new Date().toISOString(),
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  // 404 for unknown routes
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Get timestamp for a period string
 */
function getSinceTimestamp(period) {
  const now = Date.now();
  const periods = {
    '1h': 3600000,
    '24h': 86400000,
    '7d': 604800000,
    '30d': 2592000000,
    '90d': 7776000000,
    'all': 0,
  };
  const ms = periods[period] || periods['7d'];
  return now - ms;
}

/**
 * Get overview stats
 */
async function getOverview(env, websiteId, since, corsHeaders) {
  const [total, unique, timeStats] = await Promise.all([
    getTotalPageviews(env, websiteId, since),
    getUniqueVisitors(env, websiteId, since),
    getTimeStats(env, websiteId, since, 'day'),
  ]);

  // Calculate average per day
  const days = timeStats.length || 1;
  const avgDaily = Math.round(total / days);

  // Current hour stats
  const currentHourSince = Date.now() - 3600000;
  const currentHour = await getTotalPageviews(env, websiteId, currentHourSince);

  return new Response(JSON.stringify({
    total,
    unique,
    avgDaily,
    currentHour,
    timeStats,
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Get time series data
 */
async function getTimeSeriesData(env, websiteId, since, groupBy, corsHeaders) {
  const stats = await getTimeStats(env, websiteId, since, groupBy);
  return new Response(JSON.stringify({ data: stats }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Get distribution data
 */
async function getDistData(env, websiteId, field, since, corsHeaders, limit = 20) {
  const data = await getDistribution(env, websiteId, field, since, limit);
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Get country distribution with Chinese names
 */
async function getCountryData(env, websiteId, since, corsHeaders) {
  const raw = await getDistribution(env, websiteId, 'country', since, 30);
  const data = raw.map(item => ({
    name: item.country,
    display: getCountryName(item.country),
    count: item.count,
  }));
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Get recent visits
 */
async function getRecent(env, websiteId, corsHeaders) {
  const visits = await getRecentPageviews(env, websiteId, 100);
  const formatted = visits.map(v => ({
    ...v,
    country_display: getCountryName(v.country),
    time: v.timestamp ? new Date(v.timestamp * 1000).toLocaleString('zh-CN') : '',
  }));
  return new Response(JSON.stringify({ data: formatted }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Get visit history with search and pagination
 */
async function getHistory(env, websiteId, q, date, page, pageSize, corsHeaders) {
  let query = 'SELECT * FROM pageviews WHERE website_id = ?';
  const params = [websiteId || 'default'];

  // Date filter
  if (date) {
    const d = new Date(date);
    const startTs = Math.floor(d.getTime() / 1000);
    const endTs = startTs + 86400;
    query += ' AND timestamp >= ? AND timestamp < ?';
    params.push(startTs, endTs);
  }

  // Search filter
  if (q) {
    query += ' AND (ip LIKE ? OR country LIKE ? OR region LIKE ? OR city LIKE ? OR area LIKE ? OR browser LIKE ? OR os LIKE ? OR device LIKE ? OR device_brand LIKE ? OR url LIKE ? OR isp LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like, like, like, like, like, like, like, like);
  }

  // Count total
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const countResult = await env.DB.prepare(countQuery).bind(...params).first();
  const total = countResult?.total || 0;

  // Paginate
  const offset = (page - 1) * pageSize;
  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(pageSize, offset);

  const results = await env.DB.prepare(query).bind(...params).all();
  const formatted = (results.results || []).map(v => ({
    ...v,
    country_display: getCountryName(v.country),
    time: v.timestamp ? new Date(v.timestamp * 1000).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }) : '',
  }));

  return new Response(JSON.stringify({ data: formatted, total, page, pageSize }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Get all sites
 */
async function getAllSites(env, corsHeaders) {
  const sites = await getSites(env);
  return new Response(JSON.stringify({ data: sites }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

/**
 * Export data as JSON
 */
async function handleExport(env, websiteId, corsHeaders) {
  const data = await exportData(env, websiteId);
  const csvHeaders = [
    'ID', 'Website ID', 'URL', 'Referrer', 'Screen Size', 'Timestamp',
    'Country', 'Region', 'City', 'ISP',
    'Browser', 'Browser Ver', 'OS', 'OS Ver',
    'Device', 'Device Brand', 'Device Model', 'Is Mobile',
    'Language'
  ].join(',');
  
  const csvRows = data.map(v => [
    v.id,
    v.website_id,
    `"${(v.url || '').replace(/"/g, '""')}"`,
    `"${(v.referrer || '').replace(/"/g, '""')}"`,
    v.screen_size,
    new Date((v.timestamp || 0) * 1000).toISOString(),
    v.country,
    v.region,
    v.city,
    v.isp,
    v.browser,
    v.browser_version,
    v.os,
    v.os_version,
    v.device,
    v.device_brand,
    v.device_model,
    v.is_mobile,
    v.lang,
  ].join(','));
  
  const csv = csvHeaders + '\n' + csvRows.join('\n');
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="analytics-export-${websiteId}-${Date.now()}.csv"`,
      ...corsHeaders,
    },
  });
}