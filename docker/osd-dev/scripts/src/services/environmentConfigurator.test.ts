import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  initializeBaseEnvironment,
  setVersionDerivedEnvironment,
  configureModeAndSecurity,
} from './environmentConfigurator';
import type { EnvironmentPaths, ScriptConfig } from '../types/config';
import { PathAccessError, ValidationError } from '../errors';

describe('services/environmentConfigurator', () => {
  let tmpdir = '';
  let envPaths: EnvironmentPaths;

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-env-'));
    const containerRoot = path.join(tmpdir, 'container');
    fs.mkdirSync(containerRoot, { recursive: true });
    envPaths = {
      currentRepoContainerRoot: containerRoot,
      siblingContainerRoot: path.join(tmpdir, 'sibling-container'),
      currentRepoHostRoot: path.join(tmpdir, 'host'),
      siblingRepoHostRoot: path.join(tmpdir, 'sibling'),
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
    jest.restoreAllMocks();
  });

  it('initializeBaseEnvironment sets baseline env vars', () => {
    const cfg: ScriptConfig = {
      osVersion: '2.9.0',
      osdVersion: '2.9.0',
      agentsUp: '',
      userRepositories: [],
      pluginsRoot: '/some/root',
      action: 'up',
      mode: '',
      modeVersion: '',
      dashboardBase: '',
      useDashboardFromSource: false,
      enableSaml: false,
      serverFlagVersion: '',
      serverLocalFlagVersion: '',
    };
    initializeBaseEnvironment(cfg);
    expect(process.env.PASSWORD).toBeDefined();
    expect(process.env.OS_VERSION).toBe('2.9.0');
    expect(process.env.OSD_VERSION).toBe('2.9.0');
    expect(process.env.OSD_PORT).toBeDefined();
    expect(process.env.IMPOSTER_VERSION).toBeDefined();
    expect(process.env.SRC).toBe('/some/root');
  });

  it('setVersionDerivedEnvironment computes major and project name, and reads package version best-effort', () => {
    // Provide package.json in container path
    const pkgDir = path.dirname(envPaths.packageJsonPath);
    fs.mkdirSync(pkgDir, { recursive: true });
    fs.writeFileSync(envPaths.packageJsonPath, '{"version":"4.12.0"}');

    setVersionDerivedEnvironment('2.9.1', envPaths);
    expect(process.env.OSD_MAJOR_NUMBER).toBe('2');
    expect(process.env.COMPOSE_PROJECT_NAME).toBe('os-dev-291');
    expect(process.env.WAZUH_VERSION_DEVELOPMENT).toBe('4.12.0');
    expect(process.env.OSD_MAJOR).toBe('2.x');
  });

  describe('configureModeAndSecurity', () => {
    const baseCfg: ScriptConfig = {
      osVersion: '',
      osdVersion: '',
      agentsUp: '',
      userRepositories: [],
      pluginsRoot: '',
      action: 'up',
      mode: '',
      modeVersion: '',
      dashboardBase: '',
      useDashboardFromSource: false,
      enableSaml: false,
      serverFlagVersion: '',
      serverLocalFlagVersion: '',
    };

    it('returns standard profile by default and sets security paths', () => {
      process.env.OSD_MAJOR = '2.x';
      const profile = configureModeAndSecurity({ ...baseCfg });
      expect(profile).toBe('standard');
      expect(process.env.WAZUH_DASHBOARD_CONF).toContain('/config/2.x/osd/');
      expect(process.env.SEC_CONFIG_PATH).toContain(
        '/usr/share/opensearch/config',
      );
    });

    it('saml requires idp in /etc/hosts and sets SAML config', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue('127.0.0.1 localhost idp');
      process.env.OSD_MAJOR = '2.x';
      const profile = configureModeAndSecurity({ ...baseCfg, mode: 'saml' });
      expect(profile).toBe('saml');
      expect(process.env.WAZUH_DASHBOARD_CONF).toContain(
        'opensearch_dashboards_saml.yml',
      );
    });

    it('saml throws PathAccessError if /etc/hosts cannot be read', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('EACCES');
      });
      expect(() =>
        configureModeAndSecurity({ ...baseCfg, mode: 'saml' }),
      ).toThrow(PathAccessError);
    });

    it('server requires version and sets WAZUH_STACK', () => {
      expect(() =>
        configureModeAndSecurity({ ...baseCfg, mode: 'server' }),
      ).toThrow(ValidationError);
      const profile = configureModeAndSecurity({
        ...baseCfg,
        mode: 'server',
        modeVersion: '4.12.0',
      });
      expect(profile).toBe('server');
      expect(process.env.WAZUH_STACK).toBe('4.12.0');
    });

    it('server-local variants set IMAGE_TAG and profile (via -a)', () => {
      const p1 = configureModeAndSecurity({
        ...baseCfg,
        mode: 'server-local',
        modeVersion: '4.12.0',
        agentsUp: 'rpm',
      });
      expect(p1).toBe('server-local-rpm');
      expect(process.env.IMAGE_TAG).toBe('4.12.0');

      const p2 = configureModeAndSecurity({
        ...baseCfg,
        mode: 'server-local',
        modeVersion: '4.12.0',
        agentsUp: 'without',
      });
      expect(p2).toBe('server-local-without');
    });

    it('rejects direct server-local-* modes as unsupported', () => {
      expect(() =>
        configureModeAndSecurity({
          ...baseCfg,
          mode: 'server-local-without',
          modeVersion: '4.12.0',
        }),
      ).toThrow(ValidationError);
    });
  });
});
