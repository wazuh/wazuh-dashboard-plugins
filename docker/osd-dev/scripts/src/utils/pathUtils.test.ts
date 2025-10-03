import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  stripTrailingSlash,
  toContainerPath,
  ensureAccessibleHostPath,
} from './pathUtils';
import type { EnvironmentPaths } from '../types/config';
import { PathAccessError } from '../errors';

describe('utils/pathUtils', () => {
  describe('stripTrailingSlash', () => {
    it('removes trailing slashes but preserves root', () => {
      expect(stripTrailingSlash('')).toBe('');
      expect(stripTrailingSlash('/')).toBe('/');
      expect(stripTrailingSlash('/a/b/')).toBe('/a/b');
      expect(stripTrailingSlash('/a/b//')).toBe('/a/b');
      expect(stripTrailingSlash('////')).toBe('/');
    });
  });

  describe('toContainerPath', () => {
    const hostRoot = '/host/repo';
    const siblingHost = '/host/sibling';
    const containerRoot = '/container/repo';
    const siblingContainer = '/container/sibling';
    const envPaths: EnvironmentPaths = {
      currentRepoContainerRoot: containerRoot,
      siblingContainerRoot: siblingContainer,
      currentRepoHostRoot: hostRoot,
      siblingRepoHostRoot: siblingHost,
      packageJsonPath: path.join(
        containerRoot,
        'plugins/wazuh-core/package.json',
      ),
      createNetworksScriptPath: path.join(
        containerRoot,
        'docker/scripts/create_docker_networks.sh',
      ),
    };

    it('maps host path under current repo to container path', () => {
      expect(toContainerPath('/host/repo', envPaths)).toBe('/container/repo');
      expect(toContainerPath('/host/repo/plugins', envPaths)).toBe(
        '/container/repo/plugins',
      );
      expect(toContainerPath('/host/repo/plugins/x/y', envPaths)).toBe(
        '/container/repo/plugins/x/y',
      );
    });

    it('maps host path under sibling root to container sibling path', () => {
      expect(toContainerPath('/host/sibling', envPaths)).toBe(
        '/container/sibling',
      );
      expect(toContainerPath('/host/sibling/myproj', envPaths)).toBe(
        '/container/sibling/myproj',
      );
    });

    it('returns empty string for paths outside known roots', () => {
      expect(toContainerPath('/elsewhere', envPaths)).toBe('');
      expect(toContainerPath('', envPaths)).toBe('');
    });
  });

  describe('ensureAccessibleHostPath', () => {
    let tmpdir: string;
    let envPaths: EnvironmentPaths;

    beforeEach(() => {
      tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-pathutils-'));
      const containerRoot = path.join(tmpdir, 'container');
      const hostRoot = path.join(tmpdir, 'host');
      const siblingHost = path.join(tmpdir, 'sibling');
      const siblingContainer = path.join(tmpdir, 'sibling-container');
      fs.mkdirSync(containerRoot, { recursive: true });
      fs.mkdirSync(hostRoot, { recursive: true });
      fs.mkdirSync(siblingHost, { recursive: true });
      fs.mkdirSync(siblingContainer, { recursive: true });

      envPaths = {
        currentRepoContainerRoot: containerRoot,
        siblingContainerRoot: siblingContainer,
        currentRepoHostRoot: hostRoot,
        siblingRepoHostRoot: siblingHost,
        packageJsonPath: path.join(
          containerRoot,
          'plugins/wazuh-core/package.json',
        ),
        createNetworksScriptPath: path.join(
          containerRoot,
          'docker/scripts/create_docker_networks.sh',
        ),
      };
    });

    afterEach(() => {
      try {
        fs.rmSync(tmpdir, { recursive: true, force: true });
      } catch {}
    });

    it('does not throw when container-mapped path exists', () => {
      const hostPath = path.join(envPaths.currentRepoHostRoot, 'dir');
      const containerPath = path.join(envPaths.currentRepoContainerRoot, 'dir');
      fs.mkdirSync(containerPath, { recursive: true });
      expect(() =>
        ensureAccessibleHostPath(hostPath, 'Test path', envPaths),
      ).not.toThrow();
    });

    it('throws PathAccessError when not visible from container', () => {
      const missingHostPath = path.join(
        envPaths.currentRepoHostRoot,
        'missing',
      );
      expect(() =>
        ensureAccessibleHostPath(missingHostPath, 'Sample', envPaths),
      ).toThrow(PathAccessError);
    });
  });
});
