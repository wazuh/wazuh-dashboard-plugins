/**
 * Gets the agent version in a structured format.
 * It removes any leading 'v' and splits the version into major, minor, and patch components.
 * Example: "v4.14.4" will be parsed into { major: 4, minor: 14, patch: 4, raw: "4.14.4" }.
 * @param version The version string to parse.
 * @returns An object containing the major, minor, patch numbers and the raw version string without the leading 'v'.
 */
export const getAgentVersion = (
  version: string,
): { major: number; minor: number; patch: number; raw: string } => {
  // const raw = version.replace(//, '');
  const [, rawVersion, majorText, minorText, patchText] = version.match(
    /((\d+)\.(\d+)\.(\d+))/,
  ); // This regex captures the version numbers in groups, allowing for optional leading 'v' and any additional text.

  const raw = rawVersion || version; // Fallback to original version if regex doesn't match
  const major = Number(majorText) || 0;
  const minor = Number(minorText) || 0;
  const patch = Number(patchText) || 0;

  return {
    major,
    minor,
    patch,
    raw,
  };
};
