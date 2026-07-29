/** Renders any caught value as a human-readable message: an Error's `.message`, else `String(error)`. */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
