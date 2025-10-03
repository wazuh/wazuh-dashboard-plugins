/**
 * Minimal logger utility with level filtering and optional context.
 * Keep console.* under the hood to preserve test spies on console.
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Log level priority map: lower numbers = higher priority (less verbose).
 * When a log level is set (e.g., 'warn'), only messages with priority <= that level are shown.
 *
 * Example: If CURRENT_LEVEL = 'warn' (priority 1):
 *   - error (0) ✓ shown
 *   - warn  (1) ✓ shown
 *   - info  (2) ✗ hidden
 *   - debug (3) ✗ hidden
 */
const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Reads log level from LOG_LEVEL environment variable.
 * Defaults to 'info' if not set or invalid.
 */
function readLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  if (raw === 'error' || raw === 'warn' || raw === 'info' || raw === 'debug') return raw;
  return 'info';
}

let CURRENT_LEVEL = readLevel();

export interface Logger {
  level: LogLevel;
  setLevel(level: LogLevel): void;
  /** Logs with a [INFO] prefix. */
  info(message?: any, ...optionalParams: any[]): void;
  /** Logs without any level prefix (keeps context only). */
  infoPlain(message?: any, ...optionalParams: any[]): void;
  /** Logs with a [WARN] prefix. */
  warn(message?: any, ...optionalParams: any[]): void;
  /** Logs with a [ERROR] prefix. */
  error(message?: any, ...optionalParams: any[]): void;
  /** Logs with a [DEBUG] prefix. */
  debug(message?: any, ...optionalParams: any[]): void;
  withContext(context: string): Logger;
}

function shouldLog(target: LogLevel) {
  return LEVEL_ORDER[target] <= LEVEL_ORDER[CURRENT_LEVEL];
}

function prefix(context?: string) {
  return context ? `[${context}] ` : '';
}

function createLogger(context?: string): Logger {
  return {
    level: CURRENT_LEVEL,
    setLevel(level: LogLevel) {
      CURRENT_LEVEL = level;
      this.level = level;
    },
    info(message?: any, ...optionalParams: any[]) {
      if (!shouldLog('info')) return;
      console.log(`${prefix(context)}[INFO] ${message}`, ...optionalParams);
    },
    infoPlain(message?: any, ...optionalParams: any[]) {
      if (!shouldLog('info')) return;
      console.log(`${prefix(context)}${message}`, ...optionalParams);
    },
    warn(message?: any, ...optionalParams: any[]) {
      if (!shouldLog('warn')) return;
      console.warn(`${prefix(context)}[WARN] ${message}`, ...optionalParams);
    },
    error(message?: any, ...optionalParams: any[]) {
      if (!shouldLog('error')) return;
      console.error(`${prefix(context)}[ERROR] ${message}`, ...optionalParams);
    },
    debug(message?: any, ...optionalParams: any[]) {
      if (!shouldLog('debug')) return;
      console.log(`${prefix(context)}[DEBUG] ${message}`, ...optionalParams);
    },
    withContext(next: string) {
      return createLogger(context ? `${context}:${next}` : next);
    },
  };
}

export const logger: Logger = createLogger('dev-script');
export const createChildLogger = (context: string) => logger.withContext(context);
