/**
 * Centralized logging utility
 * In production, logs can be filtered or sent to a logging service
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug';

const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true;
    // In production, only log errors and warnings
    return level === 'error' || level === 'warn';
  }

  log(...args: unknown[]): void {
    if (this.shouldLog('log')) {
      console.log('[LOG]', ...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
    // In production, you might want to send errors to a logging service
    // e.g., Sentry, LogRocket, etc.
  }

  debug(...args: unknown[]): void {
    if (isDevelopment && this.shouldLog('debug')) {
      console.debug('[DEBUG]', ...args);
    }
  }
}

export const logger = new Logger();
