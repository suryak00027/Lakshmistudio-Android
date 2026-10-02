import type { PostgrestError } from '@supabase/supabase-js';

export interface SupabaseErrorInfo {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
  httpStatus: number | null;
  operation: string;
}

export function parseSupabaseError(
  error: unknown,
  operation: string
): SupabaseErrorInfo {
  if (error && typeof error === 'object' && 'message' in error) {
    const pgError = error as PostgrestError;
    return {
      message: pgError.message || 'Unknown error',
      code: pgError.code ?? null,
      details: pgError.details ?? null,
      hint: pgError.hint ?? null,
      httpStatus: null,
      operation,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: null,
      details: null,
      hint: null,
      httpStatus: null,
      operation,
    };
  }

  return {
    message: String(error),
    code: null,
    details: null,
    hint: null,
    httpStatus: null,
    operation,
  };
}

export function logSupabaseError(error: unknown, operation: string): SupabaseErrorInfo {
  const info = parseSupabaseError(error, operation);
  console.error(`[Supabase] ${info.operation} failed:`, {
    message: info.message,
    code: info.code,
    details: info.details,
    hint: info.hint,
  });
  return info;
}

export function getErrorToastMessage(info: SupabaseErrorInfo): string {
  if (info.code === '42501' || info.message.toLowerCase().includes('rls') || info.message.toLowerCase().includes('policy')) {
    return `Database policy blocked this action (${info.operation}). Please check permissions.`;
  }
  if (info.code === '23505') {
    return `This record already exists (${info.operation}).`;
  }
  if (info.code === '23503') {
    return `Referenced record not found (${info.operation}).`;
  }
  if (info.message.toLowerCase().includes('jwt') || info.message.toLowerCase().includes('token') || info.message.toLowerCase().includes('expired')) {
    return `Authentication key expired (${info.operation}). Please check Supabase configuration.`;
  }
  if (info.message.toLowerCase().includes('fetch') || info.message.toLowerCase().includes('network') || info.message.toLowerCase().includes('failed to fetch')) {
    return `Network error (${info.operation}). Cannot reach the database server.`;
  }
  return `${info.operation} failed: ${info.message}`;
}
