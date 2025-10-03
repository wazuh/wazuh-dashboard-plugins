import path from 'path';
import fs from 'fs';
import os from 'os';
import { parseArguments, printUsageAndExit } from './argumentParser';
import type { EnvironmentPaths } from '../types/config';
import { MockLogger } from '../../__mocks__/mockLogger';
import { ValidationError, ConfigurationError } from '../errors';

describe('services/argumentParser', () => {
  const logger = new MockLogger('test');

  describe('printUsageAndExit', () => {
    it('exits with code 1 after printing usage', () => {
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(((
        code?: number,
      ) => {
        throw new Error(`exit:${code ?? 0}`);
      }) as unknown as (code?: number) => never);
      expect(() => printUsageAndExit(logger)).toThrow(/exit:1/);
      exitSpy.mockRestore();
    });
  });

  describe('parseArguments', () => {
    let tmpdir = '';
    let envPaths: EnvironmentPaths;
    let containerRoot = '';
    let hostRoot = '';
    let siblingRoot = '';

    beforeEach(() => {
      tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-arg-'));
      containerRoot = path.join(tmpdir, 'container');
      hostRoot = path.join(tmpdir, 'host');
      siblingRoot = path.join(tmpdir, 'sibling');
      fs.mkdirSync(containerRoot, { recursive: true });
      fs.mkdirSync(hostRoot, { recursive: true });
      fs.mkdirSync(siblingRoot, { recursive: true });
      const siblingContainer = path.join(tmpdir, 'sibling-container');
      fs.mkdirSync(siblingContainer, { recursive: true });

      // Provide container mapping for required files
      const corePkgDir = path.join(containerRoot, 'plugins', 'wazuh-core');
      fs.mkdirSync(corePkgDir, { recursive: true });
      fs.writeFileSync(
        path.join(corePkgDir, 'package.json'),
        '{"pluginPlatform":{"version":"2.9.0"}}',
      );

      envPaths = {
        currentRepoContainerRoot: containerRoot,
        siblingContainerRoot: siblingContainer,
        currentRepoHostRoot: hostRoot,
        siblingRepoHostRoot: siblingRoot,
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

    it('parses flags and action/mode/modeVersion correctly', () => {
      const cfg = parseArguments(
        [
          '-o',
          '2.9.0',
          '-d',
          '2.9.0',
          '-a',
          'rpm',
          'up',
          'server-local',
          '4.12.0',
        ],
        envPaths,
        logger,
      );
      expect(cfg.osVersion).toBe('2.9.0');
      expect(cfg.osdVersion).toBe('2.9.0');
      expect(cfg.agentsUp).toBe('rpm');
      expect(cfg.action).toBe('up');
      expect(cfg.mode).toBe('server-local');
      expect(cfg.modeVersion).toBe('4.12.0');
    });

    it('rejects unsupported option', () => {
      expect(() => parseArguments(['-z'], envPaths, logger)).toThrow(
        ValidationError,
      );
    });

    it('validates -a allowed values', () => {
      expect(() =>
        parseArguments(['-a', 'rpm'], envPaths, logger),
      ).not.toThrow();
      expect(() => parseArguments(['-a', 'invalid'], envPaths, logger)).toThrow(
        ValidationError,
      );
    });

    it('auto-detects -base when no path provided and sibling root available', () => {
      // Provide wazuh-dashboard at sibling root for auto-detection
      const dashHost = path.join(
        envPaths.siblingRepoHostRoot,
        'wazuh-dashboard',
      );
      const dashContainer = path.join(
        envPaths.siblingContainerRoot,
        'wazuh-dashboard',
      );
      fs.mkdirSync(dashHost, { recursive: true });
      fs.mkdirSync(dashContainer, { recursive: true });
      const cfg = parseArguments(['-base', 'up'], envPaths, logger);
      expect(cfg.useDashboardFromSource).toBe(true);
      expect(cfg.dashboardBase).toBe(dashHost);
    });

    it('ignores relative value after -base and auto-detects from sibling root', () => {
      // Prepare sibling wazuh-dashboard so auto-detection succeeds
      const dashHost = path.join(
        envPaths.siblingRepoHostRoot,
        'wazuh-dashboard',
      );
      const dashContainer = path.join(
        envPaths.siblingContainerRoot,
        'wazuh-dashboard',
      );
      fs.mkdirSync(dashHost, { recursive: true });
      fs.mkdirSync(dashContainer, { recursive: true });
      const cfg = parseArguments(['-base', 'relative/path'], envPaths, logger);
      expect(cfg.useDashboardFromSource).toBe(true);
      expect(cfg.dashboardBase).toBe(dashHost);
    });

    it('throws ConfigurationError when -base cannot be inferred', () => {
      const noSibling: EnvironmentPaths = {
        ...envPaths,
        siblingRepoHostRoot: '',
      };
      expect(() => parseArguments(['-base', 'up'], noSibling, logger)).toThrow(
        ConfigurationError,
      );
    });
  });
});
