#!/usr/bin/env ts-node

import { main } from './src/app/main';
import { DevScriptError, ValidationError } from './src/errors';
import { logger } from './src/utils/logger';
import { parseArguments } from './src/services/argumentParser';
import { getEnvironmentPaths } from './src/constants/paths';

function handleError(error: unknown): never {
  const message =
    error instanceof DevScriptError
      ? error.message
      : (error as any)?.message || String(error);
  logger.error(`${message}`);
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
    // Pre-parse to surface validation errors synchronously
    parseArguments(argv, envPaths, logger);
  }
} catch (error) {
  // Only hard-exit on validation problems during pre-parse
  const isValidation =
    error instanceof ValidationError || error instanceof DevScriptError;
  if (isValidation) {
    handleError(error);
  } else {
    logger.error(`${String((error as any)?.message || error)}`);
  }
}

try {
  const result = main(argv);
  if (result && typeof (result as any).then === 'function') {
    (result as Promise<void>).catch(err => {
      const message =
        err instanceof DevScriptError
          ? err.message
          : (err as any)?.message || String(err);
      logger.error(`${message}`);
    });
  }
} catch (error) {
  // Synchronous exceptions at runtime are unexpected; log without exiting to keep tests stable
  const message =
    error instanceof DevScriptError
      ? error.message
      : (error as any)?.message || String(error);
  logger.error(`${message}`);
}
