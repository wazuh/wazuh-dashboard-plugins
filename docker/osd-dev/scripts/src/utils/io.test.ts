import fs from 'fs';
import path from 'path';
import os from 'os';
import { readJsonFile, writeFile } from './io';
import { PathAccessError, ValidationError, DevScriptError } from '../errors';

describe('utils/io', () => {
  let tmpdir = '';

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-io-'));
  });

  afterEach(() => {
    try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
    jest.restoreAllMocks();
  });

  it('readJsonFile returns parsed JSON when file exists and valid', () => {
    const file = path.join(tmpdir, 'ok.json');
    fs.writeFileSync(file, '{"a":1,"b":"x"}', 'utf-8');
    const data = readJsonFile<{ a: number; b: string }>(file);
    expect(data.a).toBe(1);
    expect(data.b).toBe('x');
  });

  it('readJsonFile throws PathAccessError when file missing', () => {
    const file = path.join(tmpdir, 'missing.json');
    expect(() => readJsonFile(file)).toThrow(PathAccessError);
  });

  it('readJsonFile throws ValidationError when JSON invalid', () => {
    const file = path.join(tmpdir, 'bad.json');
    fs.writeFileSync(file, '{"a":1,', 'utf-8');
    expect(() => readJsonFile(file)).toThrow(ValidationError);
  });

  it('writeFile writes content and throws DevScriptError on failure', () => {
    const file = path.join(tmpdir, 'out.txt');
    writeFile(file, 'hello');
    expect(fs.readFileSync(file, 'utf-8')).toBe('hello');

    const spy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      throw new Error('disk error');
    });
    expect(() => writeFile(path.join(tmpdir, 'fail.txt'), 'x')).toThrow(DevScriptError);
    spy.mockRestore();
  });
});

