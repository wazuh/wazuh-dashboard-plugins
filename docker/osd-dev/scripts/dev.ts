#!/usr/bin/env ts-node

import { main } from './src/app/main';
import { DevScriptError } from './src/utils/errors';
import { parseArguments } from './src/services/argumentParser';
import { getEnvironmentPaths } from './src/constants/paths';

function handleError(error: unknown): never {
  const message = error instanceof DevScriptError ? error.message : ((error as any)?.message || String(error));
  // eslint-disable-next-line no-console
  console.error(`[ERROR] ${message}`);
  // Important for tests: allow mocked process.exit to throw and bubble
  // so dynamic import rejects on validation errors.
  // Do not wrap in try/catch to keep synchronous propagation.
  process.exit(1);
}

const argv = process.argv.slice(2);

// Pre-parse to surface validation errors synchronously (so import() rejects in tests)
try {
  const envPaths = getEnvironmentPaths();
  if (argv.length > 0) {
    parseArguments(argv, envPaths);
  }
} catch (error) {
  handleError(error);
}

try {
  const result = main(argv);
  // If main returned a promise, attach async error handler
  if (result && typeof (result as any).then === 'function') {
    (result as Promise<void>).catch(handleError);
  }
} catch (error) {
  handleError(error);
}
