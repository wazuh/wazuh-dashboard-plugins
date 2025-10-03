import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  resolveRepositoryHostPath,
  resolveRequiredRepositories,
} from './repoResolver';
import type { EnvironmentPaths, ScriptConfig } from '../types/config';
import { ValidationError } from '../errors';

describe('services/repoResolver', () => {
  let tmpdir = '';
  let envPaths: EnvironmentPaths;
  let containerRoot = '';
  let hostRoot = '';

  const baseConfig: ScriptConfig = {
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
  };

  beforeEach(() => {
    tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdp-repo-'));
    containerRoot = path.join(tmpdir, 'container');
    hostRoot = path.join(tmpdir, 'host');
    fs.mkdirSync(containerRoot, { recursive: true });
    fs.mkdirSync(hostRoot, { recursive: true });
    envPaths = {
      currentRepoContainerRoot: containerRoot,
      siblingContainerRoot: path.join(tmpdir, 'sibling-container'),
      currentRepoHostRoot: hostRoot,
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
    // Ensure sibling container dir exists
    fs.mkdirSync(envPaths.siblingContainerRoot, { recursive: true });
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpdir, { recursive: true, force: true });
    } catch {}
  });

  it('uses absolute override path when provided', () => {
    const repoName = 'main';
    // Create container-visible path for override validation
    const overrideHost = path.join(hostRoot, 'overrides', repoName);
    const overrideContainer = path.join(containerRoot, 'overrides', repoName);
    fs.mkdirSync(overrideHost, { recursive: true });
    fs.mkdirSync(overrideContainer, { recursive: true });
    fs.writeFileSync(
      path.join(overrideContainer, 'package.json'),
      '{"name":"main"}',
    );

    const cfg: ScriptConfig = {
      ...baseConfig,
      userRepositories: [{ name: repoName, path: overrideHost }],
    };
    const resolved = resolveRepositoryHostPath(repoName, cfg, envPaths);
    expect(resolved).toBe(overrideHost);
  });

  it('rejects non-absolute override paths', () => {
    const repoName = 'main';
    const cfg: ScriptConfig = {
      ...baseConfig,
      userRepositories: [{ name: repoName, path: 'relative/path' }],
    };
    expect(() => resolveRepositoryHostPath(repoName, cfg, envPaths)).toThrow(
      ValidationError,
    );
  });

  it('auto-detects repo from pluginsRoot and package.json presence', () => {
    const repoName = 'main';
    // Host pluginsRoot and container mirror
    const pluginsRootHost = path.join(hostRoot, 'plugins');
    const repoHost = path.join(pluginsRootHost, repoName);
    const repoContainer = path.join(containerRoot, 'plugins', repoName);
    fs.mkdirSync(repoHost, { recursive: true });
    fs.mkdirSync(repoContainer, { recursive: true });
    fs.writeFileSync(
      path.join(repoContainer, 'package.json'),
      '{"name":"main"}',
    );

    const cfg: ScriptConfig = { ...baseConfig, pluginsRoot: pluginsRootHost };
    const resolved = resolveRepositoryHostPath(repoName, cfg, envPaths);
    expect(resolved).toBe(repoHost);
  });

  it('throws when repo cannot be located in any candidate base', () => {
    const repoName = 'missing-plugin';
    const cfg: ScriptConfig = { ...baseConfig };
    expect(() => resolveRepositoryHostPath(repoName, cfg, envPaths)).toThrow(
      ValidationError,
    );
  });

  it('resolveRequiredRepositories builds env map of names to paths', () => {
    // Prepare three repos under plugins
    const repos = ['main', 'wazuh-core', 'wazuh-check-updates'];
    for (const r of repos) {
      const host = path.join(hostRoot, 'plugins', r);
      const cont = path.join(containerRoot, 'plugins', r);
      fs.mkdirSync(host, { recursive: true });
      fs.mkdirSync(cont, { recursive: true });
      fs.writeFileSync(path.join(cont, 'package.json'), `{"name":"${r}"}`);
    }
    const cfg: ScriptConfig = {
      ...baseConfig,
      pluginsRoot: path.join(hostRoot, 'plugins'),
    };
    const map = resolveRequiredRepositories(
      repos as readonly string[],
      cfg,
      envPaths,
    );
    expect(Array.from(map.keys()).sort()).toEqual(
      ['REPO_MAIN', 'REPO_WAZUH_CHECK_UPDATES', 'REPO_WAZUH_CORE'].sort(),
    );
    expect(map.get('REPO_MAIN')).toBe(path.join(hostRoot, 'plugins', 'main'));
  });
});
