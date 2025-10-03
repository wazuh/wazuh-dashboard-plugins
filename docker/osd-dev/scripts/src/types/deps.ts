import type { Logger } from '../utils/logger';

export interface ProcessRunner {
  execSync: (cmd: string, opts?: any) => any;
  spawn: (cmd: string, args: string[], opts?: any) => { on: (event: 'close', cb: (code: number) => void) => any };
}

export interface Dependencies {
  logger: Logger;
  processRunner?: ProcessRunner;
}
