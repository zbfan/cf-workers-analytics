/**
 * Static File Serving
 * Serves the dashboard HTML and other static assets
 */
import { renderDashboard } from './dashboard';

export async function serveDashboard(request, env, corsHeaders) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Serve main dashboard
  if (path === '/' || path === '/dashboard' || path === '/index.html') {
    const html = renderDashboard(env);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
        ...corsHeaders,
      },
    });
  }

  // 404
  return new Response('Not Found', { status: 404 });
}