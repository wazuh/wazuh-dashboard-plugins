/** Utility helpers related to environment variables. */

/** Convert a repo name to an environment variable name used by compose. */
export function toRepositoryEnvVar(repoName: string): string {
  const sanitized = repoName.replace(/-/g, '_').replace(/\./g, '_');
  const upper = sanitized.toUpperCase();
  return `REPO_${upper}`;
}

/** Set a series of environment variables from a map. */
export function applyEnvironmentVariables(map: Map<string, string>): void {
  for (const [key, value] of map.entries()) {
    process.env[key] = value;
  }
}

/** Read an env var or use a default value. */
export function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined ? value : fallback;
}

