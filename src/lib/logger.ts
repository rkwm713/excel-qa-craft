// Logging utility for production-safe logging
// In development, logs to console. In production, can be configured to send to logging service

const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug("[DEBUG]", ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info("[INFO]", ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    // Warnings are shown in both dev and prod
    console.warn("[WARN]", ...args);
  },
  
  error: (...args: unknown[]) => {
    // Errors are always logged
    console.error("[ERROR]", ...args);
    // In production, you could send to error tracking service here
    // e.g., Sentry.captureException(error)
  },
};
