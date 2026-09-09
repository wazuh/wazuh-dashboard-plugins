import { obfuscateEnrollmentTokenInCommand } from './enrollment-token-command-service';

describe('obfuscateEnrollmentTokenInCommand', () => {
  it('masks the token value and leaves the rest of the command alone', () => {
    const command =
      "wget https://packages/wazuh-agent.deb && sudo WAZUH_ENROLLMENT_TOKEN='eyJ2ZXIiOjEsImFkciI6Im0uZXhhbXBsZS5jb20ifQ' WAZUH_AGENT_NAME='node01' dpkg -i ./wazuh-agent.deb";

    const masked = obfuscateEnrollmentTokenInCommand(command);

    expect(masked).not.toContain('eyJ2ZXIiOjEs');
    expect(masked).toContain(`WAZUH_ENROLLMENT_TOKEN='${'*'.repeat(32)}'`);
    expect(masked).toContain("WAZUH_AGENT_NAME='node01'");
  });

  it('returns the command unchanged when it carries no token', () => {
    const command = "sudo WAZUH_AGENT_NAME='node01' dpkg -i ./wazuh-agent.deb";

    expect(obfuscateEnrollmentTokenInCommand(command)).toBe(command);
  });
});
