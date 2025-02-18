import { Logger, LogMeta, LogRecord } from '@osd/logging';

const noop = () => {};

export class NoopLogger implements Logger {
  info(_message: string): void {
    return noop();
  }

  error(_message: string): void {
    return noop();
  }

  debug(_message: string): void {
    return noop();
  }

  warn(_message: string): void {
    return noop();
  }

  trace(_message: string, _meta?: LogMeta): void {
    return noop();
  }

  fatal(_errorOrMessage: string | Error, _meta?: LogMeta): void {
    return noop();
  }

  log(_record: LogRecord): void {
    return noop();
  }

  get(..._childContextPaths: string[]): Logger {
    return this;
  }
}
