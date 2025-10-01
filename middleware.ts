import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  validateRequestSize, 
  validateOrigin, 
  validateUserAgent, 
  logSuspiciousActivity,
  detectSuspiciousPatterns 
} from './lib/security';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Проверяем размер запроса
  const contentLength = request.headers.get('content-length');
  if (!validateRequestSize(contentLength)) {
    logSuspiciousActivity('oversized_request', { contentLength }, request);
    return new NextResponse('Request too large', { status: 413 });
  }
  
  // Проверяем User-Agent
  const userAgent = request.headers.get('user-agent');
  if (!validateUserAgent(userAgent)) {
    logSuspiciousActivity('suspicious_user_agent', { userAgent }, request);
    // Не блокируем, но логируем
  }
  
  // Проверяем origin для API маршрутов
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Публичные эндпоинты
    const publicEndpoints = ['/api/leaderboard'];
    
    if (!publicEndpoints.includes(request.nextUrl.pathname)) {
      // Для защищенных эндпоинтов требуем Telegram origin
      const isTelegramOrigin = origin?.includes('t.me') || 
                              origin?.includes('telegram.org') ||
                              referer?.includes('t.me') ||
                              referer?.includes('telegram.org');
      
      if (!isTelegramOrigin) {
        logSuspiciousActivity('unauthorized_origin', { origin, referer, path: request.nextUrl.pathname }, request);
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }
  
  // Проверяем подозрительные паттерны в URL
  const url = request.nextUrl.toString();
  const suspiciousPatterns = detectSuspiciousPatterns(url);
  if (suspiciousPatterns.length > 0) {
    logSuspiciousActivity('suspicious_url_pattern', { patterns: suspiciousPatterns, url }, request);
  }
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // CSP для защиты от XSS
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https:; " +
    "font-src 'self' data:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "form-action 'self';"
  );
  
  // CORS headers
  if (origin && validateOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  // Обработка preflight запросов
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
