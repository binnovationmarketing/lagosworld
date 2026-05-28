/**
 * Vercel Edge Middleware — host-based routing
 * Rewrites lagoscleaning.app/ → /cleaning (URL stays clean, no redirect)
 * Runs BEFORE static file serving, so public/index.html is never served.
 */
export default function middleware(request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';

  const isCleaningDomain =
    host === 'lagoscleaning.app' ||
    host === 'www.lagoscleaning.app';

  // Rewrite root to cleaning page — URL stays as lagoscleaning.app/
  if (isCleaningDomain && url.pathname === '/') {
    const dest = new URL('/cleaning', request.url);
    return fetch(dest, { headers: request.headers });
  }
}

export const config = {
  matcher: '/'
};
