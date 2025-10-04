import { EventEmitter } from 'events';

export class StubRunner {
  public spawnCalls: { cmd: string; args: string[] }[] = [];

  execSync(_cmd: string, _opts?: any) {
    // no-op
  }

  spawn(cmd: string, args: string[], _opts?: any) {
    this.spawnCalls.push({ cmd, args });
    const ee = new EventEmitter();
    process.nextTick(() => ee.emit('close', 0));
    // minimal shape compatible with .on('close', fn)
    return ee as any;
  }
}
