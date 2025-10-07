/**
 * Compares two semantic versions (e.g., "4.12.0" and "4.12.5")
 * Returns true if versionA < versionB
 */
export function isVersionLower(versionA: string, versionB: string): boolean {
  const aParts = versionA.split('.').map(Number);
  const bParts = versionB.split('.').map(Number);

  // Normalize lengths, in case any version has fewer parts
  const maxLength = Math.max(aParts.length, bParts.length);
  while (aParts.length < maxLength) aParts.push(0);
  while (bParts.length < maxLength) bParts.push(0);

  // Compare part by part
  for (let i = 0; i < maxLength; i++) {
    if (aParts[i] < bParts[i]) return true;
    if (aParts[i] > bParts[i]) return false;
  }

  return false;
}
