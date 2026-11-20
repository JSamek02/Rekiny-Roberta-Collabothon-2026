import { routing } from '@/i18n/routing';
import createMiddleware from 'next-intl/middleware';

export default createMiddleware(routing);

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: [
    '/((?!api|_next/static|css|fonts|img|tmp-images|video|plugins|pwa|config|js|_next/image|documents|data|favicon.ico|manifest.json|robots.txt|sw.js|workbox-*.).*)',
  ],
};
