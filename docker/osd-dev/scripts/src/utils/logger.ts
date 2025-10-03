/**
 * Logger utility with level filtering and optional context.
 * Implemented as a class to allow alternative implementations (e.g., mocks).
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
function parseLevel(raw?: string): LogLevel {
  const val = (raw || '').toLowerCase();
  return (['error', 'warn', 'info', 'debug'] as LogLevel[]).includes(
    val as LogLevel,
  )
    ? (val as LogLevel)
    : 'info';
}

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

function shouldLog(current: LogLevel, target: LogLevel) {
  return LEVEL_ORDER[target] <= LEVEL_ORDER[current];
}

function prefix(context?: string) {
  return context ? `[${context}] ` : '';
}

export class ConsoleLogger implements Logger {
  public level: LogLevel;
  private readonly context?: string;

  constructor(context?: string, level?: LogLevel) {
    this.context = context;
    this.level = level || parseLevel(process.env.LOG_LEVEL) || 'info';
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  info(message?: any, ...optionalParams: any[]): void {
    if (!shouldLog(this.level, 'info')) return;
    console.log(`${prefix(this.context)}[INFO] ${message}`, ...optionalParams);
  }

  infoPlain(message?: any, ...optionalParams: any[]): void {
    if (!shouldLog(this.level, 'info')) return;
    console.log(`${prefix(this.context)}${message}`, ...optionalParams);
  }

  warn(message?: any, ...optionalParams: any[]): void {
    if (!shouldLog(this.level, 'warn')) return;
    console.warn(`${prefix(this.context)}[WARN] ${message}`, ...optionalParams);
  }

  error(message?: any, ...optionalParams: any[]): void {
    if (!shouldLog(this.level, 'error')) return;
    console.error(
      `${prefix(this.context)}[ERROR] ${message}`,
      ...optionalParams,
    );
  }

  debug(message?: any, ...optionalParams: any[]): void {
    if (!shouldLog(this.level, 'debug')) return;
    console.log(`${prefix(this.context)}[DEBUG] ${message}`, ...optionalParams);
  }

  withContext(context: string): Logger {
    const childContext = this.context ? `${this.context}:${context}` : context;
    return new ConsoleLogger(childContext, this.level);
  }
}

export const logger: Logger = new ConsoleLogger('dev-script');
export const createChildLogger = (context: string) =>
  logger.withContext(context);
