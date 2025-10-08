import semver from 'semver';

/**
 * Compares two semantic versions (e.g., "4.12.0" and "4.12.5").
 * Returns true if versionA < versionB.
 * Handles edge cases like invalid versions or '-' values.
 */
export function isVersionLower(versionA: string, versionB: string): boolean {
  // Handle edge cases
  if (!semver.valid(versionA) || !semver.valid(versionB)) {
    return false;
  }

  try {
    // Clean versions by removing any 'v' prefix and ensuring valid semver format
    const cleanVersionA = semver.coerce(versionA);
    const cleanVersionB = semver.coerce(versionB);

    // If either version cannot be coerced to valid semver, return false
    if (!cleanVersionA || !cleanVersionB) {
      return false;
    }

    return semver.lt(cleanVersionA, cleanVersionB);
  } catch (error) {
    return false;
  }
}
