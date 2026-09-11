/* The token text is unpadded base64url and hundreds of characters long, so it
is masked with a fixed run of asterisks rather than one per character: matching
its length would push the rest of the command out of view without hiding
anything more. The command that is copied is always the unmasked one. */
const ENROLLMENT_TOKEN_MASK = '*'.repeat(32);

const ENROLLMENT_TOKEN_PATTERN = /WAZUH_ENROLLMENT_TOKEN='[^']*'/g;

/**
 * Replace the value of every WAZUH_ENROLLMENT_TOKEN assignment in a generated
 * command with a mask. The variable is spelled the same way on the three
 * operating systems, so no per-OS handling is needed.
 */
export const obfuscateEnrollmentTokenInCommand = (
  commandText: string,
): string =>
  commandText.replace(
    ENROLLMENT_TOKEN_PATTERN,
    `WAZUH_ENROLLMENT_TOKEN='${ENROLLMENT_TOKEN_MASK}'`,
  );
