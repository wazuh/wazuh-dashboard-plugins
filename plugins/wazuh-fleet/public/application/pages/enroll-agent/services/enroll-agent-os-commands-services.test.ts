import {
  generateInstallCommandFromForm,
  generateStartCommandFromForm,
  getEnrollOptions,
} from './enroll-agent-os-commands-services';

describe('get enroll commands', () => {
  it.each`
    system               | form | options | result
    ${'linux_deb_amd64'}
    ${{
  operatingSystemSelection: { value: 'linux_deb_amd64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_deb_arm64'} | ${{
  operatingSystemSelection: { value: 'linux_deb_arm64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_amd64'} | ${{
  operatingSystemSelection: { value: 'linux_rpm_amd64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_arm64'} | ${{
  operatingSystemSelection: { value: 'linux_rpm_arm64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'windows'} | ${{
  operatingSystemSelection: { value: 'windows' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"--enroll-url 'https://server:55000' --user 'user' --password 'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'macos_intel64'} | ${{
  operatingSystemSelection: { value: 'macos_intel64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"--enroll-url 'https://server:55000' --user 'user' --password 'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'macos_arm64'} | ${{
  operatingSystemSelection: { value: 'macos_arm64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"--enroll-url 'https://server:55000' --user 'user' --password 'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_deb_amd64'} | ${{
  operatingSystemSelection: { value: 'linux_deb_amd64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_deb_arm64'} | ${{
  operatingSystemSelection: { value: 'linux_deb_arm64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_amd64'} | ${{
  operatingSystemSelection: { value: 'linux_rpm_amd64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_arm64'} | ${{
  operatingSystemSelection: { value: 'linux_rpm_arm64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"--enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'windows'} | ${{
  operatingSystemSelection: { value: 'windows' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"--enroll-url 'https://server:55000' --user 'user' --password '****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'macos_intel64'} | ${{
  operatingSystemSelection: { value: 'macos_intel64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"--enroll-url 'https://server:55000' --user 'user' --password '****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'macos_arm64'} | ${{
  operatingSystemSelection: { value: 'macos_arm64' },
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"--enroll-url 'https://server:55000' --user 'user' --password '****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
  `(
    'generate enroll option flags for $system',
    ({ system, form, options, result }) => {
      expect(
        getEnrollOptions(
          { ...form, operatingSystemSelection: { value: system } },
          options,
        ),
      ).toBe(result);
    },
  );

  it.each`
    system               | form | options | result
    ${'linux_deb_amd64'}
    ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"sudo dpkg -i ./wazuh-agent_5.0.0-1_amd64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_deb_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"sudo dpkg -i ./wazuh-agent_5.0.0-1_arm64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_amd64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"sudo rpm -ihv wazuh-agent-5.0.0-1.x86_64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"sudo rpm -ihv wazuh-agent-5.0.0-1.aarch64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'windows'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${String.raw`Start-Process msiexec.exe "/i $env:tmp\wazuh-agent.msi; /q" -Wait; & 'C:\Program Files\wazuh-agent\wazuh-agent.exe' --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password 'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'`}
    ${'macos_intel64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${String.raw`sudo installer -pkg ./wazuh-agent.pkg -target / && /Library/Application\ Support/Wazuh\ agent.app/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password 'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'`}
    ${'macos_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${String.raw`sudo installer -pkg ./wazuh-agent.pkg -target / && /Library/Application\ Support/Wazuh\ agent.app/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password 'pass' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'`}
    ${'linux_deb_amd64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"sudo dpkg -i ./wazuh-agent_5.0.0-1_amd64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_deb_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"sudo dpkg -i ./wazuh-agent_5.0.0-1_arm64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_amd64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"sudo rpm -ihv wazuh-agent-5.0.0-1.x86_64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'linux_rpm_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${"sudo rpm -ihv wazuh-agent-5.0.0-1.aarch64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password $'****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'"}
    ${'windows'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${String.raw`Start-Process msiexec.exe "/i $env:tmp\wazuh-agent.msi; /q" -Wait; & 'C:\Program Files\wazuh-agent\wazuh-agent.exe' --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password '****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'`}
    ${'macos_intel64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${String.raw`sudo installer -pkg ./wazuh-agent.pkg -target / && /Library/Application\ Support/Wazuh\ agent.app/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password '****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'`}
    ${'macos_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0', obfuscatePassword: true }} | ${String.raw`sudo installer -pkg ./wazuh-agent.pkg -target / && /Library/Application\ Support/Wazuh\ agent.app/bin/wazuh-agent --enroll-agent --enroll-url 'https://server:55000' --user 'user' --password '****' --name 'test' --verification-mode 'none' --connect-url 'https://comms:27000' --key '00000000000000000000000000000000'`}
  `(
    'generate the install command for $system',
    ({ system, form, options, result }) => {
      expect(
        generateInstallCommandFromForm(
          { ...form, operatingSystemSelection: { value: system } },
          options,
        ),
      ).toBe(result);
    },
  );

  it.each`
    system               | form | options | result
    ${'linux_deb_amd64'}
    ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent'}
    ${'linux_deb_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent'}
    ${'linux_rpm_amd64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent'}
    ${'linux_rpm_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent'}
    ${'windows'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${"NET START 'Wazuh Agent'"}
    ${'macos_intel64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${'sudo /Library/Ossec/bin/wazuh-control start'}
    ${'macos_arm64'} | ${{
  serverAddress: { value: 'https://server:55000' },
  username: { value: 'user' },
  password: { value: 'pass' },
  agentName: { value: 'test' },
  verificationMode: { value: 'none' },
  enrollmentKey: { value: '00000000000000000000000000000000' },
  communicationsAPIUrl: { value: 'https://comms:27000' },
}} | ${{ version: '5.0.0' }} | ${'sudo /Library/Ossec/bin/wazuh-control start'}
  `(
    'generate the start command for $system',
    ({ system, form, options, result }) => {
      expect(
        generateStartCommandFromForm(
          { ...form, operatingSystemSelection: { value: system } },
          options,
        ),
      ).toBe(result);
    },
  );
});
