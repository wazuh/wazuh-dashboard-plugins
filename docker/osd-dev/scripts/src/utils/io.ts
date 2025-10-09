import { existsSync, readFileSync, writeFileSync } from 'fs';
import { DevScriptError, PathAccessError, ValidationError } from '../errors';
import { msgFailedParseJson, msgFileNotFound } from '../constants/messages';

export function readJsonFile<T = unknown>(absolutePath: string): T {
  if (!existsSync(absolutePath)) {
    throw new PathAccessError(msgFileNotFound(absolutePath));
  }
  try {
    const content = readFileSync(absolutePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    throw new ValidationError(msgFailedParseJson(absolutePath));
  }
}

export function writeFile(absolutePath: string, content: string): void {
  try {
    writeFileSync(absolutePath, content);
  } catch (error) {
    throw new DevScriptError(`Failed to write file: ${absolutePath}`);
  }
}
