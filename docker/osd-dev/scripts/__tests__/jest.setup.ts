import path from 'path';

// Silence console output globally while preserving call tracking
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock the logger module to route through console mocks (so tests that spy on console keep working)
const loggerModulePath = path.resolve(__dirname, '..', 'src', 'utils', 'logger');

let sharedLogger: any;
const make = (context?: string) => ({
  level: 'info',
  setLevel: jest.fn(),
  info: (...args: any[]) => {
    if (args.length > 0) {
      const [first, ...rest] = args;
      console.log(`[INFO] ${first}`, ...rest);
    } else {
      console.log();
    }
  },
  infoPlain: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => {
    if (args.length > 0) {
      const [first, ...rest] = args;
      console.warn(`[WARN] ${first}`, ...rest);
    } else {
      console.warn();
    }
  },
  error: (...args: any[]) => {
    if (args.length > 0) {
      const [first, ...rest] = args;
      console.error(`[ERROR] ${first}`, ...rest);
    } else {
      console.error();
    }
  },
  debug: (...args: any[]) => {
    if (args.length > 0) {
      const [first, ...rest] = args;
      console.log(`[DEBUG] ${first}`, ...rest);
    } else {
      console.log();
    }
  },
  withContext: (c: string) => make(c),
});

jest.doMock(loggerModulePath, () => {
  if (!sharedLogger) {
    sharedLogger = make('dev-script');
  }
  return { logger: sharedLogger, createChildLogger: (c: string) => make(c) };
});
