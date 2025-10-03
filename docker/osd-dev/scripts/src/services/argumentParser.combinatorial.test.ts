import fs from 'fs';
import path from 'path';
import os from 'os';
import { parseArguments, printUsageAndExit } from './argumentParser';
import type { EnvironmentPaths } from '../types/config';
import { MockLogger } from '../../__mocks__/mockLogger';
import { ValidationError } from '../errors';

describe('services/argumentParser (combinatorial)', () => {
  const logger = new MockLogger('test');

  function makeEnv(): { tmpdir: string; envPaths: EnvironmentPaths; paths: Record<string, string> } {
    const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-arg-matrix-'));
    const containerRoot = path.join(tmpdir, 'container');
    const hostRoot = path.join(tmpdir, 'host');
    const siblingHost = path.join(tmpdir, 'sibling');
    const siblingContainer = path.join(tmpdir, 'sibling-container');
    fs.mkdirSync(containerRoot, { recursive: true });
    fs.mkdirSync(hostRoot, { recursive: true });
    fs.mkdirSync(siblingHost, { recursive: true });
    fs.mkdirSync(siblingContainer, { recursive: true });

    // Minimal file needed by some logic (best-effort read in other services)
    const corePkgDir = path.join(containerRoot, 'plugins', 'wazuh-core');
    fs.mkdirSync(corePkgDir, { recursive: true });
    fs.writeFileSync(path.join(corePkgDir, 'package.json'), '{"pluginPlatform":{"version":"2.9.0"}}');

    const envPaths: EnvironmentPaths = {
      currentRepoContainerRoot: containerRoot,
      siblingContainerRoot: siblingContainer,
      currentRepoHostRoot: hostRoot,
      siblingRepoHostRoot: siblingHost,
      packageJsonPath: path.join(containerRoot, 'plugins/wazuh-core/package.json'),
      createNetworksScriptPath: path.join(containerRoot, 'docker/scripts/create_docker_networks.sh'),
    };
    return { tmpdir, envPaths, paths: { containerRoot, hostRoot, siblingHost, siblingContainer } };
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('empty argv returns defaults (main decides usage/exit)', () => {
    const { envPaths, tmpdir } = makeEnv();
    try {
      const cfg = parseArguments([], envPaths, logger);
      expect(cfg.action).toBe('');
      expect(cfg.mode).toBe('');
      expect(cfg.userRepositories.length).toBe(0);
    } finally {
      try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
    }
  });

  describe('actions matrix', () => {
    const actions = ['up', 'down', 'stop', 'start', 'manager-local-up'] as const;
    it.each(actions.map((a) => [a]))('parses action=%s', (action) => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        const cfg = parseArguments([action], envPaths, logger);
        expect(cfg.action).toBe(action);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('agentsUp flag', () => {
    const values = ['rpm', 'deb', 'without'] as const;
    it.each(values.map((v) => [v]))('accepts -a %s', (val) => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        const cfg = parseArguments(['-a', val, 'up'], envPaths, logger);
        expect(cfg.agentsUp).toBe(val);
        expect(cfg.action).toBe('up');
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });

    it('rejects -a invalid', () => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        expect(() => parseArguments(['-a', 'wrong', 'up'], envPaths, logger)).toThrow(ValidationError);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('version flags -o/-d', () => {
    it('sets both os and osd versions', () => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        const cfg = parseArguments(['-o', '2.9.0', '-d', '2.9.0', 'up'], envPaths, logger);
        expect(cfg.osVersion).toBe('2.9.0');
        expect(cfg.osdVersion).toBe('2.9.0');
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('repository overrides -r', () => {
    it('accepts multiple -r and trims trailing slash', () => {
      const { envPaths, tmpdir, paths } = makeEnv();
      try {
        // No accessibility validation for -r in parser, so absolute host paths suffice
        const repoA = path.join(paths.hostRoot, 'extA');
        const repoB = path.join(paths.hostRoot, 'extB');
        const cfg = parseArguments(['-r', `alpha=${repoA}/`, '-r', `beta=${repoB}`, 'up'], envPaths, logger);
        expect(cfg.userRepositories).toEqual([
          { name: 'alpha', path: repoA },
          { name: 'beta', path: repoB },
        ]);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });

    it('shorthand -r <name> resolves under sibling root when present', () => {
      const { envPaths, tmpdir, paths } = makeEnv();
      try {
        const name = 'custom-plugin';
        const host = path.join(paths.siblingHost, name);
        const container = path.join(paths.siblingContainer, name);
        fs.mkdirSync(host, { recursive: true });
        fs.mkdirSync(container, { recursive: true });
        // Add package.json presence on container path for visibility checks in later stages
        fs.writeFileSync(path.join(container, 'package.json'), '{"name":"custom-plugin"}');
        const cfg = parseArguments(['-r', name, 'up'], envPaths, logger);
        expect(cfg.userRepositories).toEqual([{ name, path: host }]);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });

    it('shorthand -r <name> throws when not under sibling root', () => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        // No folder created under sibling, so ensureAccessibleHostPath will fail
        expect(() => parseArguments(['-r', 'missing-plugin', 'up'], envPaths, logger)).toThrow();
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
    });

  describe('pluginsRoot path argument (absolute before action)', () => {
    it('sets pluginsRoot and action', () => {
      const { envPaths, tmpdir, paths } = makeEnv();
      try {
        // Ensure container-mapped path exists so accessibility check passes
        const hostBase = path.join(paths.hostRoot, 'base');
        const containerBase = path.join(paths.containerRoot, 'base');
        fs.mkdirSync(containerBase, { recursive: true });
        const cfg = parseArguments([hostBase, 'up'], envPaths, logger);
        expect(cfg.pluginsRoot).toBe(hostBase);
        expect(cfg.action).toBe('up');
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('-base sources mode', () => {
    it('auto-detects dashboard base when not provided', () => {
      const { envPaths, tmpdir, paths } = makeEnv();
      try {
        // Provide wazuh-dashboard under sibling host and container
        const dashHost = path.join(paths.siblingHost, 'wazuh-dashboard');
        const dashContainer = path.join(paths.siblingContainer, 'wazuh-dashboard');
        fs.mkdirSync(dashHost, { recursive: true });
        fs.mkdirSync(dashContainer, { recursive: true });
        const cfg = parseArguments(['-base', 'up'], envPaths, logger);
        expect(cfg.useDashboardFromSource).toBe(true);
        expect(cfg.dashboardBase).toBe(dashHost);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });

    it('uses explicit absolute base when provided', () => {
      const { envPaths, tmpdir, paths } = makeEnv();
      try {
        const baseHost = path.join(paths.hostRoot, 'dashboard');
        const baseContainer = path.join(paths.containerRoot, 'dashboard');
        fs.mkdirSync(baseContainer, { recursive: true });
        const cfg = parseArguments(['-base', baseHost, 'up'], envPaths, logger);
        expect(cfg.useDashboardFromSource).toBe(true);
        expect(cfg.dashboardBase).toBe(baseHost);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });

    it('ignores relative arg after -base and auto-detects', () => {
      const { envPaths, tmpdir, paths } = makeEnv();
      try {
        const dashHost = path.join(paths.siblingHost, 'wazuh-dashboard');
        const dashContainer = path.join(paths.siblingContainer, 'wazuh-dashboard');
        fs.mkdirSync(dashHost, { recursive: true });
        fs.mkdirSync(dashContainer, { recursive: true });
        const cfg = parseArguments(['-base', 'relative/path', 'up'], envPaths, logger);
        expect(cfg.useDashboardFromSource).toBe(true);
        expect(cfg.dashboardBase).toBe(dashHost);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('mode and version parsing after action', () => {
    it('captures mode and optional version tokens', () => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        const cfg1 = parseArguments(['up', 'saml'], envPaths, logger);
        expect(cfg1.mode).toBe('saml');
        expect(cfg1.modeVersion).toBe('');

        const cfg2 = parseArguments(['up', 'server', '4.12.0'], envPaths, logger);
        expect(cfg2.mode).toBe('server');
        expect(cfg2.modeVersion).toBe('4.12.0');
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });

    it('rejects any extra args after action/mode/mode_version', () => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        expect(() => parseArguments(['up', 'saml', 'extra', 'arg'], envPaths, logger)).toThrow(ValidationError);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
  });

  describe('invalid or unsupported flags', () => {
    it('throws on unknown flag', () => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        expect(() => parseArguments(['-z'], envPaths, logger)).toThrow(ValidationError);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });

    it('throws when a flag appears after action', () => {
      const { envPaths, tmpdir } = makeEnv();
      try {
        expect(() => parseArguments(['up', '-o', '2.9.0'], envPaths, logger)).toThrow(ValidationError);
      } finally {
        try { fs.rmSync(tmpdir, { recursive: true, force: true }); } catch {}
      }
    });
  });
});
