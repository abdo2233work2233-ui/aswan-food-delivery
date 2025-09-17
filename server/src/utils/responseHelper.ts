import { Response } from 'express';

// Enhanced API Response interface with i18n support
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  messageAr?: string;
  data?: T;
  errors?: string[] | Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Response helper with automatic translation
export class ResponseHelper {
  static success<T>(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey: string,
    data?: T,
    statusCode = 200,
    meta?: any
  ) {
    const response: ApiResponse<T> = {
      success: true,
      message: t(messageKey),
      ...(data && { data }),
      ...(meta && { meta }),
    };

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey: string,
    errors?: string[] | Record<string, string[]>,
    statusCode = 400
  ) {
    const response: ApiResponse = {
      success: false,
      message: t(messageKey),
      ...(errors && { errors }),
    };

    return res.status(statusCode).json(response);
  }

  static validationError(
    res: Response,
    t: (key: string, options?: any) => string,
    errors: Record<string, string[]>,
    statusCode = 422
  ) {
    const response: ApiResponse = {
      success: false,
      message: t('errors.validation'),
      errors,
    };

    return res.status(statusCode).json(response);
  }

  static unauthorized(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey = 'errors.unauthorized'
  ) {
    const response: ApiResponse = {
      success: false,
      message: t(messageKey),
    };

    return res.status(401).json(response);
  }

  static forbidden(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey = 'errors.forbidden'
  ) {
    const response: ApiResponse = {
      success: false,
      message: t(messageKey),
    };

    return res.status(403).json(response);
  }

  static notFound(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey = 'errors.notFound'
  ) {
    const response: ApiResponse = {
      success: false,
      message: t(messageKey),
    };

    return res.status(404).json(response);
  }

  static serverError(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey = 'errors.serverError',
    error?: Error
  ) {
    console.error('Server Error:', error);
    
    const response: ApiResponse = {
      success: false,
      message: t(messageKey),
      ...(process.env.NODE_ENV === 'development' && error && {
        errors: [error.message],
      }),
    };

    return res.status(500).json(response);
  }

  static tooManyRequests(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey = 'errors.tooManyRequests'
  ) {
    const response: ApiResponse = {
      success: false,
      message: t(messageKey),
    };

    return res.status(429).json(response);
  }

  // Helper method for paginated responses
  static paginated<T>(
    res: Response,
    t: (key: string, options?: any) => string,
    messageKey: string,
    data: T[],
    page: number,
    limit: number,
    total: number,
    statusCode = 200
  ) {
    const totalPages = Math.ceil(total / limit);
    
    const response: ApiResponse<T[]> = {
      success: true,
      message: t(messageKey),
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    return res.status(statusCode).json(response);
  }
}

// Validation error helper
export const createValidationErrors = (
  t: (key: string, options?: any) => string,
  errors: any
): Record<string, string[]> => {
  const validationErrors: Record<string, string[]> = {};
  
  if (Array.isArray(errors)) {
    // Handle array of validation errors
    errors.forEach((error, index) => {
      validationErrors[`item_${index}`] = [t(error.messageKey || 'validation.required', error.values)];
    });
  } else if (typeof errors === 'object') {
    // Handle object with field-specific errors
    Object.keys(errors).forEach(field => {
      const fieldErrors = errors[field];
      if (Array.isArray(fieldErrors)) {
        validationErrors[field] = fieldErrors.map(error => 
          typeof error === 'string' 
            ? t(error) 
            : t(error.messageKey || 'validation.required', error.values)
        );
      } else {
        validationErrors[field] = [t(fieldErrors.messageKey || 'validation.required', fieldErrors.values)];
      }
    });
  }
  
  return validationErrors;
};

// Express error handler with i18n support
export const i18nErrorHandler = (error: any, req: any, res: Response, next: any) => {
  const t = req.t || ((key: string) => key); // Fallback if i18n not available
  
  // Handle different types of errors
  if (error.name === 'ValidationError') {
    const validationErrors = createValidationErrors(t, error.errors);
    return ResponseHelper.validationError(res, t, validationErrors);
  }
  
  if (error.name === 'UnauthorizedError' || error.status === 401) {
    return ResponseHelper.unauthorized(res, t);
  }
  
  if (error.status === 403) {
    return ResponseHelper.forbidden(res, t);
  }
  
  if (error.status === 404) {
    return ResponseHelper.notFound(res, t);
  }
  
  if (error.status === 429) {
    return ResponseHelper.tooManyRequests(res, t);
  }
  
  // Default server error
  return ResponseHelper.serverError(res, t, 'errors.serverError', error);
};