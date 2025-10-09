import { SECURITY_PLUGIN_ALIASES, SECURITY_PLUGIN_REPO_NAME } from './app';

export const COMMON_PARENT_DIRECTORY_LABEL = '<common-parent-directory>' as const;
export const COMMON_PARENT_DIRECTORY_NOT_CONFIGURED = `(${COMMON_PARENT_DIRECTORY_LABEL} not configured)` as const;

export function msgInvalidRepoSubfolder(repoName: string, repoPath: string): string {
  return `Invalid -r path for '${repoName}': '${repoPath}'. Do not point to subfolders like '/plugins/...'. Provide the repository root instead.`;
}

export function msgSecurityAutodiscoverError(lookedAt: string): string {
  const aliases = SECURITY_PLUGIN_ALIASES.join(', ');
  return `Unable to auto-discover the security plugin. Looked only at ${lookedAt}. Either pass -r <alias>=/absolute/repo/root (alias: ${aliases}), or create the canonical folder '${SECURITY_PLUGIN_REPO_NAME}' at that location.`;
}

export function msgRepoPathMustBeAbsolute(repoName: string, path: string): string {
  return `Repository path '${path}' for '${repoName}' must be absolute.`;
}

export const USAGE_NOTE_REPO_SHORTHAND =
  `Shorthand: -r <repo> (resolved under your ${COMMON_PARENT_DIRECTORY_LABEL}).` as const;

export const USAGE_NOTE_BASE_AUTODETECT =
  `Use dashboard sources from a local checkout (auto-detects under your ${COMMON_PARENT_DIRECTORY_LABEL} when path is omitted).` as const;

