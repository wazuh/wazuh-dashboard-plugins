import fs from 'fs';
import os from 'os';
import path from 'path';

export interface SavedProcessState {
  env: NodeJS.ProcessEnv;
  cwd: string;
  argv: string[];
}

// Paths relative to this helper's location:
// <repo>/docker/osd-dev/scripts/__tests__/helpers/setupTests.ts
// Go up 5 levels to reach repo root.
export const repoRoot = path.resolve(__dirname, '../../../../../');
export const siblingRoot = path.resolve(repoRoot, '..');

export function saveProcessState(): SavedProcessState {
  return {
    env: { ...process.env },
    cwd: process.cwd(),
    argv: [...process.argv],
  };
}

export function restoreProcessState(state: SavedProcessState): void {
  try {
    process.chdir(state.cwd);
  } catch {}

  // Safer env reset: clear current keys, then restore snapshot
  for (const key of Object.keys(process.env)) delete (process.env as any)[key];
  Object.assign(process.env, state.env);

  process.argv = [...state.argv];
}

export function makeTempCwd(prefix = 'wdp-jest-'): { tmpdir: string } {
  const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  process.chdir(tmpdir);
  return { tmpdir };
}

export function applyRepoEnv(
  repo: string = repoRoot,
  sibling: string = siblingRoot,
): void {
  process.env.WDP_CONTAINER_ROOT = repo;
  process.env.SIBLING_CONTAINER_ROOT = sibling;
  process.env.CURRENT_REPO_HOST_ROOT = repo;
  process.env.SIBLING_REPO_HOST_ROOT = sibling;
}

export function clearRepoDerivedEnv(): void {
  delete process.env.REPO_MAIN;
  delete process.env.REPO_WAZUH_CORE;
  delete process.env.REPO_WAZUH_CHECK_UPDATES;
  delete process.env.COMPOSE_PROJECT_NAME;
}

export function setCurrentRepoEnv(repo: string = repoRoot): void {
  process.env.WDP_CONTAINER_ROOT = repo;
  process.env.CURRENT_REPO_HOST_ROOT = repo;
}

export function setSiblingRepoEnv(sibling: string): void {
  process.env.SIBLING_REPO_HOST_ROOT = sibling;
  process.env.SIBLING_CONTAINER_ROOT = sibling;
}

export function createSiblingRootUnder(
  parentDir: string,
  name = 'sibling-root',
): string {
  const dir = path.join(parentDir, name);
  fs.mkdirSync(dir, { recursive: true });
  setSiblingRepoEnv(dir);
  return dir;
}

export function setupTestEnv(options?: {
  prefix?: string;
  withModuleReset?: boolean;
}): {
  saved: SavedProcessState;
  tmpdir: string;
  repoRoot: string;
  siblingRoot: string;
} {
  const { prefix = 'wdp-jest-', withModuleReset = true } = options || {};

  const __jest = (globalThis as any)?.jest;
  if (withModuleReset && __jest && typeof __jest.resetModules === 'function') {
    __jest.resetModules();
  }

  const saved = saveProcessState();
  const { tmpdir } = makeTempCwd(prefix);
  applyRepoEnv(repoRoot, siblingRoot);

  return { saved, tmpdir, repoRoot, siblingRoot };
}

export function teardownTestEnv(saved: SavedProcessState): void {
  restoreProcessState(saved);
}

/**
 * Usage example in a test file:
 *
 * import { setupTestEnv, teardownTestEnv } from './helpers/setupTests';
 *
 * let saved: SavedProcessState;
 * beforeEach(() => {
 *   const ctx = setupTestEnv();
 *   saved = ctx.saved;
 *   // Optionally tweak process.argv here if needed
 *   // process.argv = ['node', 'dev.ts', 'up'];
 * });
 *
 * afterEach(() => {
 *   teardownTestEnv(saved);
 * });
 */
