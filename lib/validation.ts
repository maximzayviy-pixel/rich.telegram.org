// Утилиты для валидации входных данных

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTelegramId(tg_id: any): ValidationResult {
  const errors: string[] = [];
  
  if (tg_id === undefined || tg_id === null) {
    errors.push('tg_id is required');
  } else if (typeof tg_id !== 'number') {
    errors.push('tg_id must be a number');
  } else if (!Number.isInteger(tg_id)) {
    errors.push('tg_id must be an integer');
  } else if (tg_id <= 0) {
    errors.push('tg_id must be positive');
  } else if (tg_id > Number.MAX_SAFE_INTEGER) {
    errors.push('tg_id is too large');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAmount(amount: any): ValidationResult {
  const errors: string[] = [];
  
  if (amount === undefined || amount === null) {
    errors.push('amount is required');
  } else if (typeof amount !== 'number') {
    errors.push('amount must be a number');
  } else if (!Number.isFinite(amount)) {
    errors.push('amount must be a finite number');
  } else if (amount <= 0) {
    errors.push('amount must be positive');
  } else if (amount > 1000000) {
    errors.push('amount is too large (max 1,000,000)');
  } else if (amount % 1 !== 0) {
    errors.push('amount must be an integer');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUsername(username: any): ValidationResult {
  const errors: string[] = [];
  
  if (username !== undefined && username !== null) {
    if (typeof username !== 'string') {
      errors.push('username must be a string');
    } else if (username.length > 32) {
      errors.push('username is too long (max 32 characters)');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('username contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateName(name: any, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') {
      errors.push(`${fieldName} must be a string`);
    } else if (name.length > 64) {
      errors.push(`${fieldName} is too long (max 64 characters)`);
    } else if (name.trim().length === 0) {
      errors.push(`${fieldName} cannot be empty`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePhotoUrl(photo_url: any): ValidationResult {
  const errors: string[] = [];
  
  if (photo_url !== undefined && photo_url !== null) {
    if (typeof photo_url !== 'string') {
      errors.push('photo_url must be a string');
    } else if (photo_url.length > 2048) {
      errors.push('photo_url is too long (max 2048 characters)');
    } else {
      try {
        new URL(photo_url);
      } catch {
        errors.push('photo_url must be a valid URL');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateDepositRequest(data: any): ValidationResult {
  const errors: string[] = [];
  
  const tgIdResult = validateTelegramId(data.tg_id);
  if (!tgIdResult.isValid) {
    errors.push(...tgIdResult.errors);
  }
  
  const amountResult = validateAmount(data.amount);
  if (!amountResult.isValid) {
    errors.push(...amountResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateWithdrawRequest(data: any): ValidationResult {
  const errors: string[] = [];
  
  const tgIdResult = validateTelegramId(data.tg_id);
  if (!tgIdResult.isValid) {
    errors.push(...tgIdResult.errors);
  }
  
  const amountResult = validateAmount(data.amount);
  if (!amountResult.isValid) {
    errors.push(...amountResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateUserUpsertRequest(data: any): ValidationResult {
  const errors: string[] = [];
  
  const tgIdResult = validateTelegramId(data.tg_id);
  if (!tgIdResult.isValid) {
    errors.push(...tgIdResult.errors);
  }
  
  const usernameResult = validateUsername(data.username);
  if (!usernameResult.isValid) {
    errors.push(...usernameResult.errors);
  }
  
  const firstNameResult = validateName(data.first_name, 'first_name');
  if (!firstNameResult.isValid) {
    errors.push(...firstNameResult.errors);
  }
  
  const lastNameResult = validateName(data.last_name, 'last_name');
  if (!lastNameResult.isValid) {
    errors.push(...lastNameResult.errors);
  }
  
  const photoUrlResult = validatePhotoUrl(data.photo_url);
  if (!photoUrlResult.isValid) {
    errors.push(...photoUrlResult.errors);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Функция для санитизации строковых данных
export function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, '') // Удаляем потенциально опасные символы
    .trim()
    .substring(0, 1000); // Ограничиваем длину
}

// Функция для проверки rate limiting (простая реализация)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}
