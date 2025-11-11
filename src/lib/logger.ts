type LogLevel = "debug" | "info" | "warn" | "error";

const formatMessage = (level: LogLevel, message?: unknown, ...optional: unknown[]) => {
  const ts = new Date().toISOString();
  return [`[${ts}] [${level.toUpperCase()}]`, message, ...optional];
};

export const logger = {
  debug(message?: unknown, ...optional: unknown[]) {
    if (import.meta.env.DEV) {
      console.debug(...formatMessage("debug", message, ...optional));
    }
  },
  info(message?: unknown, ...optional: unknown[]) {
    console.info(...formatMessage("info", message, ...optional));
  },
  warn(message?: unknown, ...optional: unknown[]) {
    console.warn(...formatMessage("warn", message, ...optional));
  },
  error(message?: unknown, ...optional: unknown[]) {
    console.error(...formatMessage("error", message, ...optional));
  },
};


