/**
 * Database Operations Module
 * All D1 database queries for analytics data
 */

/**
 * Ensure site exists (upsert)
 */
export async function ensureSite(env, websiteId) {
  if (!websiteId) return;
  try {
    const existing = await env.DB.prepare(
      'SELECT id FROM sites WHERE website_id = ?'
    ).bind(websiteId).first();
    
    if (!existing) {
      await env.DB.prepare(
        'INSERT INTO sites (website_id, created_at) VALUES (?, datetime(\'now\'))'
      ).bind(websiteId).run();
    }
  } catch (e) {
    console.error('Error ensuring site:', e);
  }
}

/**
 * Insert a pageview record
 */
export async function insertPageview(env, data) {
  const ts = data.timestamp || Date.now();
  const d = new Date(ts);

  const stmt = env.DB.prepare(`
    INSERT INTO pageviews (
      website_id, url, referrer, screen_size, timestamp,
      ip, ip_hash, country, country_code, region, city, area, big_area, isp, lng, lat,
      browser, browser_version, os, os_version,
      device, device_brand, device_model, is_mobile,
      lang, hour, day, month, year
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  await stmt.bind(
    data.website_id || 'default',
    data.url || '',
    data.referrer || '',
    data.screen_size || '',
    Math.floor(ts / 1000),
    data.ip || '',
    data.ip_hash || '',
    data.country || '',
    data.country_code || '',
    data.region || '',
    data.city || '',
    data.area || '',
    data.big_area || '',
    data.isp || '',
    data.lng || '',
    data.lat || '',
    data.browser || '',
    data.browser_version || '',
    data.os || '',
    data.os_version || '',
    data.device || '',
    data.device_brand || '',
    data.device_model || '',
    data.is_mobile || 0,
    data.lang || '',
    d.getHours(),
    d.getDate(),
    d.getMonth() + 1,
    d.getFullYear()
  ).run();
}

/**
 * Get total pageviews for a site
 */
export async function getTotalPageviews(env, websiteId, since) {
  let query = 'SELECT COUNT(*) as total FROM pageviews WHERE website_id = ?';
  const params = [websiteId || 'default'];
  
  if (since) {
    query += ' AND timestamp >= ?';
    params.push(Math.floor(since / 1000));
  }
  
  const result = await env.DB.prepare(query).bind(...params).first();
  return result?.total || 0;
}

/**
 * Get unique visitors (by IP hash) for a site
 */
export async function getUniqueVisitors(env, websiteId, since) {
  let query = 'SELECT COUNT(DISTINCT ip_hash) as total FROM pageviews WHERE website_id = ? AND ip_hash != \'\'';
  const params = [websiteId || 'default'];
  
  if (since) {
    query += ' AND timestamp >= ?';
    params.push(Math.floor(since / 1000));
  }
  
  const result = await env.DB.prepare(query).bind(...params).first();
  return result?.total || 0;
}

/**
 * Get stats grouped by time period (hourly/daily)
 */
export async function getTimeStats(env, websiteId, since, groupBy = 'hour') {
  let timeField;
  if (groupBy === 'day') {
    timeField = "printf('%04d-%02d-%02d', year, month, day)";
  } else {
    timeField = "printf('%04d-%02d-%02d %02d:00', year, month, day, hour)";
  }
  
  const query = `
    SELECT ${timeField} as time, COUNT(*) as count
    FROM pageviews
    WHERE website_id = ? AND timestamp >= ?
    GROUP BY time
    ORDER BY time ASC
  `;
  
  const results = await env.DB.prepare(query).bind(websiteId || 'default', Math.floor(since / 1000)).all();
  return results.results || [];
}

/**
 * Get distribution stats for any field
 */
export async function getDistribution(env, websiteId, field, since, limit = 10) {
  const query = `
    SELECT ${field}, COUNT(*) as count
    FROM pageviews
    WHERE website_id = ? AND timestamp >= ? AND ${field} != '' AND ${field} IS NOT NULL
    GROUP BY ${field}
    ORDER BY count DESC
    LIMIT ?
  `;
  
  const results = await env.DB.prepare(query).bind(websiteId || 'default', Math.floor(since / 1000), limit).all();
  return results.results || [];
}

/**
 * Get recent pageviews
 */
export async function getRecentPageviews(env, websiteId, limit = 50) {
  const query = `
    SELECT * FROM pageviews
    WHERE website_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `;
  
  const results = await env.DB.prepare(query).bind(websiteId || 'default', limit).all();
  return results.results || [];
}

/**
 * Get all registered sites
 */
export async function getSites(env) {
  const results = await env.DB.prepare(
    'SELECT * FROM sites ORDER BY created_at DESC'
  ).all();
  return results.results || [];
}

/**
 * Export all data for a site
 */
export async function exportData(env, websiteId) {
  const results = await env.DB.prepare(
    'SELECT * FROM pageviews WHERE website_id = ? ORDER BY timestamp DESC'
  ).bind(websiteId || 'default').all();
  return results.results || [];
}

/**
 * Clean old data (keep last 90 days by default)
 */
export async function cleanOldData(env, daysToKeep = 90) {
  const cutoff = Math.floor(Date.now() / 1000) - (daysToKeep * 86400);
  await env.DB.prepare(
    'DELETE FROM pageviews WHERE timestamp < ?'
  ).bind(cutoff).run();
}