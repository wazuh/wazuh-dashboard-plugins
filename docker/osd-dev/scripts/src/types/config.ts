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
