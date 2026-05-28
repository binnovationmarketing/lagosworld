/**
 * Vercel Edge Middleware — host-based routing
 *
 * lagoscleaning.app/          → serves /cleaning content (URL stays clean)
 * lagosworld.app/cleaning     → 301 redirect to lagoscleaning.app/
 * lagosworld.app/powerwashing → 301 redirect to lagoscleaning.app/powerwashing
 * lagosworld.app/airbnb       → 301 redirect to lagoscleaning.app/airbnb
 *
 * Runs BEFORE static file serving.
 */
export default function middleware(request) {
  const url  = new URL(request.url);
  const host = request.headers.get('host') || '';
  const path = url.pathname;

  const isCleaningDomain =
    host === 'lagoscleaning.app' || host === 'www.lagoscleaning.app';
  const isLagosWorld =
    host === 'lagosworld.app' || host === 'www.lagosworld.app';

  // lagoscleaning.app/ → proxy /cleaning content, URL stays clean
  if (isCleaningDomain && path === '/') {
    const dest = new URL('/cleaning', request.url);
    return fetch(dest, { headers: request.headers });
  }

  // lagosworld.app/cleaning|powerwashing|airbnb → redirect to lagoscleaning.app
  if (isLagosWorld) {
    if (path === '/cleaning' || path === '/cleaning/') {
      return Response.redirect('https://lagoscleaning.app/', 301);
    }
    if (path === '/powerwashing' || path.startsWith('/powerwashing/')) {
      return Response.redirect('https://lagoscleaning.app/powerwashing', 301);
    }
    if (path === '/airbnb' || path.startsWith('/airbnb/')) {
      return Response.redirect('https://lagoscleaning.app/airbnb', 301);
    }
  }
}

export const config = {
  matcher: ['/', '/cleaning', '/cleaning/:path*', '/powerwashing', '/powerwashing/:path*', '/airbnb', '/airbnb/:path*']
};
