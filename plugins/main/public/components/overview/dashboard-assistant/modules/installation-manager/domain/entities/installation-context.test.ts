import { InstallationContext } from './installation-context';

describe('InstallationContext', () => {
  it('sets and gets values', () => {
    const ctx = new InstallationContext();
    ctx.set('token', 'abc123');
    expect(ctx.get<string>('token')).toBe('abc123');
  });

  it('throws when getting a missing key', () => {
    const ctx = new InstallationContext();
    expect(() => ctx.get('missing')).toThrow(
      'Key "missing" not found in installation context',
    );
  });

  it('checks presence with has()', () => {
    const ctx = new InstallationContext();
    ctx.set('exists', 42);
    expect(ctx.has('exists')).toBe(true);
    expect(ctx.has('nope')).toBe(false);
  });

  it('clears all entries', () => {
    const ctx = new InstallationContext();
    ctx.set('a', 1);
    ctx.set('b', 2);
    ctx.clear();
    expect(ctx.has('a')).toBe(false);
    expect(ctx.has('b')).toBe(false);
  });

  it('converts to a plain object', () => {
    const ctx = new InstallationContext();
    ctx.set('x', 'y');
    ctx.set('n', 7);
    expect(ctx.toObject()).toEqual({ x: 'y', n: 7 });
  });
});
