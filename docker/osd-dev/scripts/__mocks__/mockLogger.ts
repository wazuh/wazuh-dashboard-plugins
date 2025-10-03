import type { Logger, LogLevel } from '../src/utils/logger';

export class MockLogger implements Logger {
  public level: LogLevel = 'info';
  private readonly context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  info(message?: any, ...optionalParams: any[]): void {}

  infoPlain(message?: any, ...optionalParams: any[]): void {}

  warn(message?: any, ...optionalParams: any[]): void {}

  error(message?: any, ...optionalParams: any[]): void {}

  debug(message?: any, ...optionalParams: any[]): void {}

  withContext(context: string): Logger {
    return new MockLogger(
      this.context ? `${this.context}:${context}` : context,
    );
  }
}

export const logger = new MockLogger('dev-script');

export const logSpy = jest.spyOn(logger, 'info');
export const logSpyPlain = jest.spyOn(logger, 'infoPlain');
export const logSpyWarn = jest.spyOn(logger, 'warn');
export const logSpyError = jest.spyOn(logger, 'error');
export const logSpyDebug = jest.spyOn(logger, 'debug');

export const createChildLogger = (context: string) => new MockLogger(context);
