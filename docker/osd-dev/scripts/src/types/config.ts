/**
 * Shared type definitions for the development script.
 */

export interface RepositoryOverride {
  /** Logical repository name, e.g. 'main', 'wazuh-core'. */
  name: string;
  /** Absolute path on the host filesystem. */
  path: string;
}

export interface ScriptConfig {
  osVersion: string;
  osdVersion: string;
  agentsUp: string;
  userRepositories: RepositoryOverride[];
  pluginsRoot: string;
  action: string;
  mode: string;
  modeVersion: string;
  dashboardBase: string;
  useDashboardFromSource: boolean;
  // Flags-based combination support (preferred over positional mode)
  enableSaml: boolean;
  serverFlagVersion: string; // from --server <version>
  serverLocalFlagVersion: string; // from --server-local <tag>
}

export interface GenerateOverrideOptions {
  /** List of external plugin repo names to mount as volumes. */
  externalRepositories: string[];
  /** Map of environment variable name -> host absolute path for each repo. */
  repositoryEnvMap: Map<string, string>;
  /** Whether to bootstrap the dashboard from sources. */
  useDashboardFromSource: boolean;
  /** Whether to include the security plugin mount when using sources. */
  includeSecurityPlugin: boolean;
}

/**
 * Paths derived from environment, used to translate host <-> container paths.
 */
export interface EnvironmentPaths {
  currentRepoContainerRoot: string; // e.g., /wdp
  siblingContainerRoot: string; // e.g., /sibling
  currentRepoHostRoot: string; // host absolute path of the current repo
  siblingRepoHostRoot: string; // host absolute path of the sibling root
  packageJsonPath: string; // container path to wazuh-core package.json
  createNetworksScriptPath: string; // container path to helper script
}

/**
 * Concrete implementation of ScriptConfig with well-defined getters/setters
 * and a simple change log to help track where values are modified.
 */
export class Config implements ScriptConfig {
  private _osVersion = '';
  private _osdVersion = '';
  private _agentsUp = '';
  private _userRepositories: RepositoryOverride[] = [];
  private _pluginsRoot = '';
  private _action = '';
  private _mode = '';
  private _modeVersion = '';
  private _dashboardBase = '';
  private _useDashboardFromSource = false;
  private _enableSaml = false;
  private _serverFlagVersion = '';
  private _serverLocalFlagVersion = '';

  private _changeLog: Array<{
    key: string;
    oldValue: unknown;
    newValue: unknown;
    source?: string;
    timestamp: number;
  }> = [];

  private logChange(
    key: string,
    oldValue: unknown,
    newValue: unknown,
    source?: string,
  ) {
    if (oldValue === newValue) return;
    this._changeLog.push({
      key,
      oldValue,
      newValue,
      source,
      timestamp: Date.now(),
    });
  }

  // Expose a read-only snapshot of the change log
  get changeLog(): ReadonlyArray<{
    key: string;
    oldValue: unknown;
    newValue: unknown;
    source?: string;
    timestamp: number;
  }> {
    return [...this._changeLog];
  }

  // osVersion
  get osVersion(): string {
    return this._osVersion;
  }
  set osVersion(value: string) {
    this.setOsVersion(value);
  }
  setOsVersion(value: string, source?: string): void {
    const prev = this._osVersion;
    this._osVersion = value;
    this.logChange('osVersion', prev, value, source);
  }

  // osdVersion
  get osdVersion(): string {
    return this._osdVersion;
  }
  set osdVersion(value: string) {
    this.setOsdVersion(value);
  }
  setOsdVersion(value: string, source?: string): void {
    const prev = this._osdVersion;
    this._osdVersion = value;
    this.logChange('osdVersion', prev, value, source);
  }

  // agentsUp
  get agentsUp(): string {
    return this._agentsUp;
  }
  set agentsUp(value: string) {
    this.setAgentsUp(value);
  }
  setAgentsUp(value: string, source?: string): void {
    const prev = this._agentsUp;
    this._agentsUp = value;
    this.logChange('agentsUp', prev, value, source);
  }

  // userRepositories
  get userRepositories(): RepositoryOverride[] {
    return [...this._userRepositories];
  }
  set userRepositories(value: RepositoryOverride[]) {
    const prev = this._userRepositories;
    this._userRepositories = [...value];
    this.logChange('userRepositories', prev, this._userRepositories, undefined);
  }
  addUserRepositoryOverride(
    override: RepositoryOverride,
    source?: string,
  ): void {
    const prev = [...this._userRepositories];
    // Normalize: trim trailing slash if any
    const normalized: RepositoryOverride = {
      name: override.name,
      path: override.path.replace(/\/$/, ''),
    };
    this._userRepositories = [...this._userRepositories, normalized];
    this.logChange('userRepositories', prev, this._userRepositories, source);
  }

  // pluginsRoot
  get pluginsRoot(): string {
    return this._pluginsRoot;
  }
  set pluginsRoot(value: string) {
    this.setPluginsRoot(value);
  }
  setPluginsRoot(value: string, source?: string): void {
    const prev = this._pluginsRoot;
    this._pluginsRoot = value;
    this.logChange('pluginsRoot', prev, value, source);
  }

  // action
  get action(): string {
    return this._action;
  }
  set action(value: string) {
    this.setAction(value);
  }
  setAction(value: string, source?: string): void {
    const prev = this._action;
    this._action = value;
    this.logChange('action', prev, value, source);
  }

  // mode
  get mode(): string {
    return this._mode;
  }
  set mode(value: string) {
    this.setMode(value);
  }
  setMode(value: string, source?: string): void {
    const prev = this._mode;
    this._mode = value;
    this.logChange('mode', prev, value, source);
  }

  // modeVersion
  get modeVersion(): string {
    return this._modeVersion;
  }
  set modeVersion(value: string) {
    this.setModeVersion(value);
  }
  setModeVersion(value: string, source?: string): void {
    const prev = this._modeVersion;
    this._modeVersion = value;
    this.logChange('modeVersion', prev, value, source);
  }

  // dashboardBase
  get dashboardBase(): string {
    return this._dashboardBase;
  }
  set dashboardBase(value: string) {
    this.setDashboardBase(value);
  }
  setDashboardBase(value: string, source?: string): void {
    const prev = this._dashboardBase;
    this._dashboardBase = value;
    this.logChange('dashboardBase', prev, value, source);
  }

  // useDashboardFromSource
  get useDashboardFromSource(): boolean {
    return this._useDashboardFromSource;
  }
  set useDashboardFromSource(value: boolean) {
    this.setUseDashboardFromSource(value);
  }
  setUseDashboardFromSource(value: boolean, source?: string): void {
    const prev = this._useDashboardFromSource;
    this._useDashboardFromSource = value;
    this.logChange('useDashboardFromSource', prev, value, source);
  }

  // enableSaml
  get enableSaml(): boolean {
    return this._enableSaml;
  }
  set enableSaml(value: boolean) {
    this.setEnableSaml(value);
  }
  setEnableSaml(value: boolean, source?: string): void {
    const prev = this._enableSaml;
    this._enableSaml = value;
    this.logChange('enableSaml', prev, value, source);
  }

  // serverFlagVersion
  get serverFlagVersion(): string {
    return this._serverFlagVersion;
  }
  set serverFlagVersion(value: string) {
    this.setServerFlagVersion(value);
  }
  setServerFlagVersion(value: string, source?: string): void {
    const prev = this._serverFlagVersion;
    this._serverFlagVersion = value;
    this.logChange('serverFlagVersion', prev, value, source);
  }

  // serverLocalFlagVersion
  get serverLocalFlagVersion(): string {
    return this._serverLocalFlagVersion;
  }
  set serverLocalFlagVersion(value: string) {
    this.setServerLocalFlagVersion(value);
  }
  setServerLocalFlagVersion(value: string, source?: string): void {
    const prev = this._serverLocalFlagVersion;
    this._serverLocalFlagVersion = value;
    this.logChange('serverLocalFlagVersion', prev, value, source);
  }
}
