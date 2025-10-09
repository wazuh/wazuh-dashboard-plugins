import {
  ACTIONS,
  FLAGS,
  SECURITY_PLUGIN_ALIASES,
  SECURITY_PLUGIN_REPO_NAME,
} from './app';

export const COMMON_PARENT_DIRECTORY_LABEL =
  '<common-parent-directory>' as const;
export const COMMON_PARENT_DIRECTORY_NOT_CONFIGURED =
  `(${COMMON_PARENT_DIRECTORY_LABEL} not configured)` as const;

export function msgInvalidRepoSubfolder(
  repoName: string,
  repoPath: string,
): string {
  return `Invalid -r path for '${repoName}': '${repoPath}'. Do not point to subfolders like '/plugins/...'. Provide the repository root instead.`;
}

export function msgSecurityAutodiscoverError(lookedAt: string): string {
  const aliases = SECURITY_PLUGIN_ALIASES.join(', ');
  return `Unable to auto-discover the security plugin. Looked only at ${lookedAt}. Either pass -r <alias>=/absolute/repo/root (alias: ${aliases}), or create the canonical folder '${SECURITY_PLUGIN_REPO_NAME}' at that location.`;
}

export function msgRepoPathMustBeAbsolute(
  repoName: string,
  path: string,
): string {
  return `Repository path '${path}' for '${repoName}' must be absolute.`;
}

export const USAGE_NOTE_REPO_SHORTHAND =
  `Shorthand: -r <repo> (resolved under your ${COMMON_PARENT_DIRECTORY_LABEL}).` as const;

export const USAGE_NOTE_BASE_AUTODETECT =
  `Use dashboard sources from a local checkout (auto-detects under your ${COMMON_PARENT_DIRECTORY_LABEL} when path is omitted).` as const;

// Generic path access error
export function msgPathNotAccessible(
  description: string,
  hostAbsolutePath: string,
  allowedRoots: string,
): string {
  return `${description} '${hostAbsolutePath}' does not exist or is not accessible from the development container. Place it under ${allowedRoots}.`;
}

// Dashboard base + Node version
export function msgDashboardBaseNotAccessible(
  dashboardBase: string,
  allowedRoots: string,
): string {
  return msgPathNotAccessible(
    'Dashboard base path',
    dashboardBase,
    allowedRoots,
  );
}

export function msgNvmrcNotFound(path: string): string {
  return `.nvmrc not found at '${path}'. Provide a valid wazuh-dashboard checkout or pass ${FLAGS.BASE} with an absolute path to it.`;
}

export function msgNvmrcEmpty(path: string): string {
  return `.nvmrc at '${path}' is empty. Cannot determine Node version.`;
}

// Repo root validation
export function msgNotValidRepoRoot(path: string): string {
  return `Path '${path}' is not a valid repository root (expected a package.json at that path). We never descend into subfolders; pass the repository root that actually contains package.json.`;
}

// CLI parse messages
export function msgFlagRequiresAbsolutePath(flag: string): string {
  return `${flag} requires an absolute path value`;
}

export function msgFlagRequiresValue(flag: string, example: string): string {
  return `${flag} requires a value, e.g. '${flag} ${example}'`;
}

export function msgInvalidAgentsUp(flag: string): string {
  return `Invalid value for ${flag} option. Allowed values are 'rpm', 'deb', 'without', or an empty string.`;
}

export function msgCannotResolveRepositoryUnderCommonParent(
  repoName: string,
  repoFlag: string,
  envVar: string,
): string {
  return `Cannot resolve repository '${repoName}' under your ${COMMON_PARENT_DIRECTORY_LABEL}. Provide ${repoFlag} ${repoName}=/absolute/path or set ${envVar} to your ${COMMON_PARENT_DIRECTORY_LABEL}.`;
}

export function msgUnsupportedOption(option: string): string {
  return `Unsupported option '${option}'.`;
}

export function msgActionProvidedMultiple(
  existing: string,
  next: string,
): string {
  return `Action provided multiple times: '${existing}' and '${next}'. Use only one positional action.`;
}

export function msgPositionalArgsNotAllowed(token: string): string {
  return `Positional arguments are not allowed (found '${token}'). Only the action token is allowed positionally; use flags for everything else.`;
}

export function msgCannotInferDashboardBase(): string {
  return 'Cannot infer dashboard base path automatically. Provide an absolute path to --base.';
}

export function msgUnableLocateWazuhDashboardAuto(): string {
  return `Unable to locate wazuh-dashboard automatically. Provide an absolute path to ${FLAGS.BASE}.`;
}

export function msgBaseRequiresAbsolute(): string {
  return `The ${FLAGS.BASE} option requires an absolute path to the wazuh-dashboard repository.`;
}

export function msgCannotCombineServerFlags(): string {
  return `Cannot combine '${FLAGS.SERVER}' and '${FLAGS.SERVER_LOCAL}' flags`;
}

export function msgMissingAction(): string {
  return 'Missing action argument';
}

export function msgDashboardEntrypointMissing(path: string): string {
  return `Expected dashboard entrypoint script at '${path}'.`;
}

// RepoResolver messages
export function msgEnvNotSet(name: string): string {
  return `${name} environment variable is not set.`;
}

export function msgRepoPathNotProvided(repo: string): string {
  return `Repository path for '${repo}' not provided. Either set ${FLAGS.PLUGINS_ROOT} to a base that contains '/plugins/${repo}' or use ${FLAGS.REPO} ${repo}=/absolute/repo/root.`;
}

// Compose/Docker
export function msgActionMustBe(): string {
  return `Action must be ${Object.values(ACTIONS).join(' | ')}`;
}

export const MSG_FAILED_CREATE_NETWORKS =
  'Failed to create docker networks' as const;

export function msgRepositoryPathNotResolved(repo: string): string {
  return `Repository path for '${repo}' not resolved.`;
}

// Environment configurator
export function msgUnsupportedModeToken(): string {
  return `Unsupported mode token. Use '${FLAGS.SERVER_LOCAL} <tag>' with '${FLAGS.AGENTS_UP} <rpm|deb|without>' instead of direct 'server-local-*' modes.`;
}

export const MSG_SERVER_MODE_REQUIRES_VERSION =
  'server mode requires the server_version argument' as const;
export const MSG_SERVER_LOCAL_MODE_REQUIRES_VERSION =
  'server-local mode requires the server_version argument' as const;

// IO
export function msgFileNotFound(path: string): string {
  return `File not found: ${path}`;
}

export function msgFailedParseJson(path: string): string {
  return `Failed to parse JSON file: ${path}`;
}
