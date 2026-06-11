-- Cloudflare D1 Database Schema
-- Database: analytics-db

-- Sites table for multi-site support
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  website_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  domain TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Page views / visits
CREATE TABLE IF NOT EXISTS pageviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  website_id TEXT NOT NULL,
  url TEXT NOT NULL,
  referrer TEXT DEFAULT '',
  screen_size TEXT DEFAULT '',
  timestamp INTEGER NOT NULL,
  ip_hash TEXT DEFAULT '',
  country TEXT DEFAULT '',
  region TEXT DEFAULT '',
  city TEXT DEFAULT '',
  isp TEXT DEFAULT '',
  browser TEXT DEFAULT '',
  browser_version TEXT DEFAULT '',
  os TEXT DEFAULT '',
  os_version TEXT DEFAULT '',
  device TEXT DEFAULT '',
  device_brand TEXT DEFAULT '',
  device_model TEXT DEFAULT '',
  is_mobile INTEGER DEFAULT 0,
  lang TEXT DEFAULT '',
  hour INTEGER DEFAULT 0,
  day INTEGER DEFAULT 0,
  month INTEGER DEFAULT 0,
  year INTEGER DEFAULT 0
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_pageviews_website_id ON pageviews(website_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_timestamp ON pageviews(timestamp);
CREATE INDEX IF NOT EXISTS idx_pageviews_hour ON pageviews(hour, day, month, year);
CREATE INDEX IF NOT EXISTS idx_pageviews_website_time ON pageviews(website_id, timestamp);