// Дополнительные меры безопасности

export interface SecurityConfig {
  maxRequestSize: number;
  allowedOrigins: string[];
  rateLimitConfig: {
    windowMs: number;
    maxRequests: number;
  };
}

export const securityConfig: SecurityConfig = {
  maxRequestSize: 1024 * 1024, // 1MB
  allowedOrigins: [
    'https://t.me',
    'https://telegram.org',
    'https://web.telegram.org'
  ],
  rateLimitConfig: {
    windowMs: 60000, // 1 минута
    maxRequests: 100
  }
};

// Функция для проверки размера запроса
export function validateRequestSize(contentLength: string | null): boolean {
  if (!contentLength) return true; // Если размер не указан, пропускаем
  
  const size = parseInt(contentLength);
  return !isNaN(size) && size <= securityConfig.maxRequestSize;
}

// Функция для проверки origin
export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  return securityConfig.allowedOrigins.some(allowedOrigin => 
    origin.startsWith(allowedOrigin)
  );
}

// Функция для проверки User-Agent
export function validateUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  
  // Проверяем, что это не бот или скрипт
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /node/i,
    /postman/i
  ];
  
  return !suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

// Функция для логирования подозрительной активности
export function logSuspiciousActivity(
  type: string, 
  details: Record<string, any>, 
  request: Request
) {
  const logData = {
    timestamp: new Date().toISOString(),
    type,
    details,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer')
  };
  
  console.warn('Suspicious activity detected:', logData);
}

// Функция для проверки CSRF токена (если нужен)
export function validateCSRFToken(token: string | null, sessionToken: string | null): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

// Функция для очистки HTML контента
export function sanitizeHTML(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

// Функция для проверки подозрительных паттернов в данных
export function detectSuspiciousPatterns(data: any): string[] {
  const warnings: string[] = [];
  
  if (typeof data === 'string') {
    // Проверяем на SQL инъекции
    if (/('|(\\')|(;)|(--)|(\/\*)|(\*\/)|(xp_)|(sp_)|(exec)|(execute)|(select)|(insert)|(update)|(delete)|(drop)|(create)|(alter)|(union)|(script)|(javascript)|(vbscript)|(onload)|(onerror)|(onclick)|(onmouseover))/i.test(data)) {
      warnings.push('Potential SQL injection or XSS attempt detected');
    }
    
    // Проверяем на слишком длинные строки
    if (data.length > 10000) {
      warnings.push('Unusually long string detected');
    }
    
    // Проверяем на подозрительные символы
    if (/[<>{}[\]\\|`~!@#$%^&*()+=;:'"<>?\/]/.test(data) && data.length > 100) {
      warnings.push('Suspicious characters detected');
    }
  }
  
  return warnings;
}

// Функция для генерации безопасного ID
export function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Функция для проверки валидности Telegram WebApp
export function validateTelegramWebApp(webApp: any): boolean {
  if (!webApp) return false;
  
  // Проверяем обязательные свойства
  const requiredProps = ['initData', 'initDataUnsafe', 'version', 'platform'];
  const hasRequiredProps = requiredProps.some(prop => webApp[prop] !== undefined);
  
  if (!hasRequiredProps) return false;
  
  // Проверяем версию
  if (webApp.version && parseFloat(webApp.version) < 6.0) return false;
  
  // Проверяем платформу
  if (webApp.platform && webApp.platform !== 'telegram') return false;
  
  return true;
}
