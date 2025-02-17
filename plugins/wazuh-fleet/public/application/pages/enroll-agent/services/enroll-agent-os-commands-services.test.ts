import {
  getAllOptionals,
  getAllOptionalsMacos,
  getDEBAMD64InstallCommand,
  getDEBARM64InstallCommand,
  getLinuxStartCommand,
  getMacOsInstallCommand,
  getMacosStartCommand,
  getRPMAMD64InstallCommand,
  getRPMARM64InstallCommand,
  getWindowsInstallCommand,
  getWindowsStartCommand,
  transformOptionalsParamatersMacOSCommand,
} from './enroll-agent-os-commands-services';

let test: any;

beforeEach(() => {
  test = {
    optionals: {
      serverAddress: "--url '1.1.1.1'",
      username: "--username 'user'",
      password: "--password 'pass'",
      agentName: "--name 'test'",
      verificationMode: "--verification-mode 'none'",
      enrollmentKey: "--key '00000000000000000000000000000000'",
    },
    urlPackage: 'https://test.com/agent.deb',
    wazuhVersion: '5.0.0',
  };
});

describe('getAllOptionals', () => {
  it('should return empty string if optionals is falsy', () => {
    const result = getAllOptionals(null);

    expect(result).toBe('');
  });

  it('should return the correct paramsText', () => {
    const optionals = {
      serverAddress: "--url '1.1.1.1'",
      username: "--username 'user'",
      password: "--password 'pass'",
      agentName: "--name 'test'",
      verificationMode: "--verification-mode 'none'",
      enrollmentKey: "--key '00000000000000000000000000000000'",
    };
    const result = getAllOptionals(optionals, 'linux');

    expect(result).toBe(
      "--url '1.1.1.1' --username 'user' --password 'pass' --verification-mode 'none' --name 'test' --key '00000000000000000000000000000000'",
    );
  });
});

describe('getDEBAMD64InstallCommand', () => {
  it('should return the correct install command', () => {
    const props = {
      optionals: {
        serverAddress: "--url 'localhost'",
        username: "--username 'user'",
        password: "--password 'pass'",
        agentName: "--name 'agent1'",
        verificationMode: "--verification-mode 'none'",
        enrollmentKey: "--key '00000000000000000000000000000000'",
      },
      urlPackage: 'https://example.com/package.deb',
      wazuhVersion: '5.0.0',
    };
    const result = getDEBAMD64InstallCommand(props);

    expect(result).toBe(
      "sudo dpkg -i ./wazuh-agent_5.0.0-1_amd64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent --url 'localhost' --username 'user' --password 'pass' --verification-mode 'none' --name 'agent1' --key '00000000000000000000000000000000'",
    );
  });
});

describe('getDEBAMD64InstallCommand', () => {
  it('should return the correct command', () => {
    let expected = `sudo dpkg -i ./wazuh-agent_${test.wazuhVersion}-1_amd64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;
    const withAllOptionals = getDEBAMD64InstallCommand(test);

    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.enrollmentKey;
    delete test.optionals.agentName;

    expected = `sudo dpkg -i ./wazuh-agent_${test.wazuhVersion}-1_amd64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;

    const withServerAddresAndAgentGroupsOptions =
      getDEBAMD64InstallCommand(test);

    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getDEBARM64InstallCommand', () => {
  it('should return the correct command', () => {
    let expected = `sudo dpkg -i ./wazuh-agent_${test.wazuhVersion}-1_arm64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;
    const withAllOptionals = getDEBARM64InstallCommand(test);

    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.enrollmentKey;
    delete test.optionals.agentName;

    expected = `sudo dpkg -i ./wazuh-agent_${test.wazuhVersion}-1_arm64.deb && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;

    const withServerAddresAndAgentGroupsOptions =
      getDEBARM64InstallCommand(test);

    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getRPMAMD64InstallCommand', () => {
  it('should return the correct command', () => {
    let expected = `sudo rpm -ihv wazuh-agent-${test.wazuhVersion}-1.x86_64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;
    const withAllOptionals = getRPMAMD64InstallCommand(test);

    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.enrollmentKey;
    delete test.optionals.agentName;

    expected = `sudo rpm -ihv wazuh-agent-${test.wazuhVersion}-1.x86_64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;

    const withServerAddresAndAgentGroupsOptions =
      getRPMAMD64InstallCommand(test);

    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getRPMARM64InstallCommand', () => {
  it('should return the correct command', () => {
    let expected = `sudo rpm -ihv wazuh-agent-${test.wazuhVersion}-1.aarch64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;
    const withAllOptionals = getRPMARM64InstallCommand(test);

    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.enrollmentKey;
    delete test.optionals.agentName;

    expected = `sudo rpm -ihv wazuh-agent-${test.wazuhVersion}-1.aarch64.rpm && sudo /usr/share/wazuh-agent/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;

    const withServerAddresAndAgentGroupsOptions =
      getRPMARM64InstallCommand(test);

    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getLinuxStartCommand', () => {
  it('returns the correct start command for Linux', () => {
    const startCommand = getLinuxStartCommand({});
    const expectedCommand =
      'sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent';

    expect(startCommand).toEqual(expectedCommand);
  });
});

// Windows

describe('getWindowsInstallCommand', () => {
  it('should return the correct install command', () => {
    let expected = `Start-Process msiexec.exe "/i $env:tmp\\wazuh-agent /q" -Wait; & 'C:\\Program Files\\wazuh-agent\\wazuh-agent.exe' --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;
    const withAllOptionals = getWindowsInstallCommand(test);

    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;

    expected = `Start-Process msiexec.exe "/i $env:tmp\\wazuh-agent /q" -Wait; & 'C:\\Program Files\\wazuh-agent\\wazuh-agent.exe' --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;

    const withServerAddresAndAgentGroupsOptions =
      getWindowsInstallCommand(test);

    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getWindowsStartCommand', () => {
  it('should return the correct start command', () => {
    const expectedCommand = "NET START 'Wazuh Agent'";
    const result = getWindowsStartCommand({});

    expect(result).toEqual(expectedCommand);
  });
});

// MacOS

describe('getAllOptionalsMacos', () => {
  it('should return empty string if optionals is falsy', () => {
    const result = getAllOptionalsMacos(null);

    expect(result).toBe('');
  });

  it('should return the correct paramsValueList', () => {
    const result = getAllOptionalsMacos(test.optionals);

    expect(result).toBe(
      [
        'serverAddress',
        'username',
        'password',
        'verificationMode',
        'agentName',
        'enrollmentKey',
      ]
        .map(key => test.optionals[key])
        .filter(Boolean)
        .join(' '),
    );
  });
});

describe('transformOptionalsParamatersMacOSCommand', () => {
  it('should transform the command correctly', () => {
    const command =
      "' serverAddress && agentGroups && agentName && protocol && wazuhPassword";
    const result = transformOptionalsParamatersMacOSCommand(command);

    expect(result).toBe(
      "' && serverAddress && agentGroups && agentName && protocol && wazuhPassword",
    );
  });
});

describe('getMacOsInstallCommand', () => {
  it('should return the correct macOS installation script', () => {
    let expected = `sudo installer -pkg ./wazuh-agent.pkg -target / && /Library/Application\\ Support/Wazuh\\ agent.app/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;
    const withAllOptionals = getMacOsInstallCommand(test);

    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;
    expected = `sudo installer -pkg ./wazuh-agent.pkg -target / && /Library/Application\\ Support/Wazuh\\ agent.app/bin/wazuh-agent --register-agent ${[
      'serverAddress',
      'username',
      'password',
      'verificationMode',
      'agentName',
      'enrollmentKey',
    ]
      .map(key => test.optionals[key])
      .filter(Boolean)
      .join(' ')}`;

    const withServerAddresAndAgentGroupsOptions = getMacOsInstallCommand(test);

    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getMacosStartCommand', () => {
  it('returns the correct start command for macOS', () => {
    const startCommand = getMacosStartCommand({});

    expect(startCommand).toEqual('sudo /Library/Ossec/bin/wazuh-control start');
  });
});
