/**
 * Centralized error types for the dev scripts.
 *
 * Use specific subclasses to provide clearer intent and easier testing.
 */

export class DevScriptError extends Error {
  /** Optional machine-readable code */
  public code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = new.target.name || DevScriptError.name;
    this.code = code;
  }
}

/** User input or CLI flags are invalid. */
export class ValidationError extends DevScriptError {}

/** A required file or directory is not visible from the container or missing. */
export class PathAccessError extends DevScriptError {}

/** Environment or configuration is missing/unsupported. */
export class ConfigurationError extends DevScriptError {}

/** Could not read or derive versions from package files. */
export class VersionResolutionError extends DevScriptError {}

/** Issues while generating dynamic docker compose overrides. */
export class ComposeOverrideError extends DevScriptError {}

/** Issues orchestrating docker compose commands. */
export class DockerComposeError extends DevScriptError {}
