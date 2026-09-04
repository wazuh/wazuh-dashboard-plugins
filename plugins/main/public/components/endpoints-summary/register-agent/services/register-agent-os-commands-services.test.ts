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
} from './register-agent-os-commands-services';

let test: any;

beforeEach(() => {
  test = {
    optionals: {
      agentGroups: "WAZUH_AGENT_GROUP='default'",
      agentName: "WAZUH_AGENT_NAME='test'",
      serverAddress: "WAZUH_MANAGER_ENDPOINT='1.1.1.1:1517/wazuh-manager/'",
      wazuhPassword: "WAZUH_REGISTRATION_PASSWORD='<CUSTOM_PASSWORD>'",
      sslVerification: "SSL_VERIFICATION='none'",
      managerCa: "WAZUH_REGISTRATION_CA='/var/ossec/etc/manager-ca.pem'",
    },
    urlPackage: 'https://test.com/agent.deb',
    wazuhVersion: '4.8.0',
  };
});

describe('getAllOptionals', () => {
  it('should return empty string if optionals is falsy', () => {
    const result = getAllOptionals(null);
    expect(result).toBe('');
  });

  it('should return the correct paramsText', () => {
    const optionals = {
      serverAddress: 'localhost',
      wazuhPassword: 'password',
      agentGroups: 'group1',
      agentName: 'agent1',
      sslVerification: 'sslVerification',
      managerCa: 'managerCa',
    };
    const result = getAllOptionals(optionals, 'linux');
    expect(result).toBe(
      'localhost password group1 agent1 sslVerification managerCa ',
    );
  });
});

describe('getDEBAMD64InstallCommand', () => {
  it('should return the correct install command', () => {
    const props = {
      optionals: {
        serverAddress: 'localhost',
        wazuhPassword: 'password',
        agentGroups: 'group1',
        agentName: 'agent1',
      },
      urlPackage: 'https://example.com/package.deb',
      packageName: 'wazuh-agent_4.0.0-beta2_amd64.deb',
      wazuhVersion: '4.0.0',
    };
    const result = getDEBAMD64InstallCommand(props);
    expect(result).toBe(
      'wget https://example.com/package.deb && sudo localhost password group1 agent1 dpkg -i ./wazuh-agent_4.0.0-beta2_amd64.deb',
    );
  });
});

describe('getDEBAMD64InstallCommand', () => {
  it('should return the correct command', () => {
    test.packageName = `wazuh-agent_${test.wazuhVersion}-beta2_amd64.deb`;
    let expected = `wget ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.wazuhPassword} ${test.optionals.agentGroups} ${test.optionals.agentName} ${test.optionals.sslVerification} ${test.optionals.managerCa} dpkg -i ./${test.packageName}`;
    const withAllOptionals = getDEBAMD64InstallCommand(test);
    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;
    delete test.optionals.sslVerification;
    delete test.optionals.managerCa;

    expected = `wget ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.agentGroups} dpkg -i ./${test.packageName}`;
    const withServerAddresAndAgentGroupsOptions =
      getDEBAMD64InstallCommand(test);
    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getDEBARM64InstallCommand', () => {
  it('should return the correct command', () => {
    test.packageName = `wazuh-agent_${test.wazuhVersion}-beta2_arm64.deb`;
    let expected = `wget ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.wazuhPassword} ${test.optionals.agentGroups} ${test.optionals.agentName} ${test.optionals.sslVerification} ${test.optionals.managerCa} dpkg -i ./${test.packageName}`;
    const withAllOptionals = getDEBARM64InstallCommand(test);
    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;
    delete test.optionals.sslVerification;
    delete test.optionals.managerCa;

    expected = `wget ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.agentGroups} dpkg -i ./${test.packageName}`;
    const withServerAddresAndAgentGroupsOptions =
      getDEBARM64InstallCommand(test);
    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getRPMAMD64InstallCommand', () => {
  it('should return the correct command', () => {
    test.packageName = `wazuh-agent-${test.wazuhVersion}-beta2.x86_64.rpm`;
    let expected = `curl -o ${test.packageName} ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.wazuhPassword} ${test.optionals.agentGroups} ${test.optionals.agentName} ${test.optionals.sslVerification} ${test.optionals.managerCa} rpm -ihv ${test.packageName}`;
    const withAllOptionals = getRPMAMD64InstallCommand(test);
    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;
    delete test.optionals.sslVerification;
    delete test.optionals.managerCa;

    expected = `curl -o ${test.packageName} ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.agentGroups} rpm -ihv ${test.packageName}`;
    const withServerAddresAndAgentGroupsOptions =
      getRPMAMD64InstallCommand(test);
    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getRPMARM64InstallCommand', () => {
  it('should return the correct command', () => {
    test.packageName = `wazuh-agent-${test.wazuhVersion}-beta2.aarch64.rpm`;
    let expected = `curl -o ${test.packageName} ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.wazuhPassword} ${test.optionals.agentGroups} ${test.optionals.agentName} ${test.optionals.sslVerification} ${test.optionals.managerCa} rpm -ihv ${test.packageName}`;
    const withAllOptionals = getRPMARM64InstallCommand(test);
    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;
    delete test.optionals.sslVerification;
    delete test.optionals.managerCa;

    expected = `curl -o ${test.packageName} ${test.urlPackage} && sudo ${test.optionals.serverAddress} ${test.optionals.agentGroups} rpm -ihv ${test.packageName}`;
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
    test.packageName = `wazuh-agent-${test.wazuhVersion}-beta2.msi`;
    let expected = `Invoke-WebRequest -Uri ${test.urlPackage} -OutFile \$env:tmp\\${test.packageName}; msiexec.exe /i \$env:tmp\\${test.packageName} /q ${test.optionals.serverAddress} ${test.optionals.wazuhPassword} ${test.optionals.agentGroups} ${test.optionals.agentName} ${test.optionals.sslVerification} ${test.optionals.managerCa} `;

    const withAllOptionals = getWindowsInstallCommand(test);
    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;
    delete test.optionals.sslVerification;
    delete test.optionals.managerCa;

    expected = `Invoke-WebRequest -Uri ${test.urlPackage} -OutFile \$env:tmp\\${test.packageName}; msiexec.exe /i \$env:tmp\\${test.packageName} /q ${test.optionals.serverAddress} ${test.optionals.agentGroups} `;
    const withServerAddresAndAgentGroupsOptions =
      getWindowsInstallCommand(test);

    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getWindowsStartCommand', () => {
  it('should return the correct start command', () => {
    const expectedCommand = 'NET START Wazuh';

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
    const optionals = {
      serverAddress: 'localhost',
      agentGroups: 'group1',
      agentName: 'agent1',
      wazuhPassword: 'password',
      sslVerification: 'sslVerification',
      managerCa: 'managerCa',
    };
    const result = getAllOptionalsMacos(optionals);
    expect(result).toBe(
      'localhost && group1 && agent1 && password && sslVerification && managerCa',
    );
  });
});

describe('transformOptionalsParamatersMacOSCommand', () => {
  it('should transform the command correctly', () => {
    const command =
      "' serverAddress && agentGroups && agentName && wazuhPassword";
    const result = transformOptionalsParamatersMacOSCommand(command);
    expect(result).toBe(
      "' && serverAddress && agentGroups && agentName && wazuhPassword",
    );
  });
});

describe('getMacOsInstallCommand', () => {
  it('should return the correct macOS installation script', () => {
    test.packageName = `wazuh-agent-${test.wazuhVersion}-beta2.intel64.pkg`;
    let expected = `curl -so ${test.packageName} ${test.urlPackage} && echo "${test.optionals.serverAddress} && ${test.optionals.agentGroups} && ${test.optionals.agentName} && ${test.optionals.wazuhPassword} && ${test.optionals.sslVerification} && ${test.optionals.managerCa}\" > /tmp/wazuh_envs && sudo installer -pkg ./${test.packageName} -target /`;

    const withAllOptionals = getMacOsInstallCommand(test);
    expect(withAllOptionals).toEqual(expected);

    delete test.optionals.wazuhPassword;
    delete test.optionals.agentName;
    delete test.optionals.sslVerification;
    delete test.optionals.managerCa;
    expected = `curl -so ${test.packageName} ${test.urlPackage} && echo "${test.optionals.serverAddress} && ${test.optionals.agentGroups}" > /tmp/wazuh_envs && sudo installer -pkg ./${test.packageName} -target /`;

    const withServerAddresAndAgentGroupsOptions = getMacOsInstallCommand(test);
    expect(withServerAddresAndAgentGroupsOptions).toEqual(expected);
  });
});

describe('getMacosStartCommand', () => {
  it('returns the correct start command for macOS', () => {
    const startCommand = getMacosStartCommand({});
    expect(startCommand).toEqual(
      'sudo launchctl load /Library/LaunchDaemons/com.wazuh.agent.plist',
    );
  });
});

// SSL verification

/* The three states the wizard can produce. Verification is on by default and
the agent already verifies on its own, so that state contributes no token at
all; only a CA path or the explicit opt-out reach the command. */
describe('SSL verification states', () => {
  const serverAddress = "WAZUH_MANAGER_ENDPOINT='1.1.1.1:1517/wazuh-manager/'";
  const managerCa = "WAZUH_REGISTRATION_CA='/var/ossec/etc/manager-ca.pem'";
  const sslVerificationOff = "SSL_VERIFICATION='none'";

  const states = {
    'verification on without a CA': { serverAddress },
    'verification on with a CA': { serverAddress, managerCa },
    'verification off': { serverAddress, sslVerification: sslVerificationOff },
  };

  const expectedTail = {
    'verification on without a CA': '',
    'verification on with a CA': `${managerCa} `,
    'verification off': `${sslVerificationOff} `,
  };

  it.each(Object.keys(states))('DEB amd64 - %s', state => {
    const result = getDEBAMD64InstallCommand({
      optionals: states[state],
      urlPackage: 'https://example.com/package.deb',
      packageName: 'wazuh-agent_5.0.0_amd64.deb',
    });
    expect(result).toEqual(
      `wget https://example.com/package.deb && sudo ${serverAddress} ${expectedTail[state]}dpkg -i ./wazuh-agent_5.0.0_amd64.deb`,
    );
  });

  it.each(Object.keys(states))('DEB aarch64 - %s', state => {
    const result = getDEBARM64InstallCommand({
      optionals: states[state],
      urlPackage: 'https://example.com/package.deb',
      packageName: 'wazuh-agent_5.0.0_arm64.deb',
    });
    expect(result).toEqual(
      `wget https://example.com/package.deb && sudo ${serverAddress} ${expectedTail[state]}dpkg -i ./wazuh-agent_5.0.0_arm64.deb`,
    );
  });

  it.each(Object.keys(states))('RPM amd64 - %s', state => {
    const result = getRPMAMD64InstallCommand({
      optionals: states[state],
      urlPackage: 'https://example.com/package.rpm',
      packageName: 'wazuh-agent-5.0.0.x86_64.rpm',
    });
    expect(result).toEqual(
      `curl -o wazuh-agent-5.0.0.x86_64.rpm https://example.com/package.rpm && sudo ${serverAddress} ${expectedTail[state]}rpm -ihv wazuh-agent-5.0.0.x86_64.rpm`,
    );
  });

  it.each(Object.keys(states))('RPM aarch64 - %s', state => {
    const result = getRPMARM64InstallCommand({
      optionals: states[state],
      urlPackage: 'https://example.com/package.rpm',
      packageName: 'wazuh-agent-5.0.0.aarch64.rpm',
    });
    expect(result).toEqual(
      `curl -o wazuh-agent-5.0.0.aarch64.rpm https://example.com/package.rpm && sudo ${serverAddress} ${expectedTail[state]}rpm -ihv wazuh-agent-5.0.0.aarch64.rpm`,
    );
  });

  it.each(Object.keys(states))('Windows MSI - %s', state => {
    const result = getWindowsInstallCommand({
      optionals: states[state],
      urlPackage: 'https://example.com/package.msi',
      packageName: 'wazuh-agent-5.0.0.msi',
      name: 'windows',
    });
    expect(result).toEqual(
      `Invoke-WebRequest -Uri https://example.com/package.msi -OutFile $env:tmp\\wazuh-agent-5.0.0.msi; msiexec.exe /i $env:tmp\\wazuh-agent-5.0.0.msi /q ${serverAddress} ${expectedTail[state]}`,
    );
  });

  /* macOS joins the variables with && into /tmp/wazuh_envs instead of
  prefixing them to the installer call. */
  const expectedMacosEnvs = {
    'verification on without a CA': serverAddress,
    'verification on with a CA': `${serverAddress} && ${managerCa}`,
    'verification off': `${serverAddress} && ${sslVerificationOff}`,
  };

  it.each(Object.keys(states))('macOS - %s', state => {
    const result = getMacOsInstallCommand({
      optionals: states[state],
      urlPackage: 'https://example.com/package.pkg',
      packageName: 'wazuh-agent-5.0.0.intel64.pkg',
    });
    expect(result).toEqual(
      `curl -so wazuh-agent-5.0.0.intel64.pkg https://example.com/package.pkg && echo "${expectedMacosEnvs[state]}" > /tmp/wazuh_envs && sudo installer -pkg ./wazuh-agent-5.0.0.intel64.pkg -target /`,
    );
  });

  it('keeps a CA path containing spaces inside its quotes', () => {
    const windowsCa = "WAZUH_REGISTRATION_CA='C:\\Program Files\\ca.pem'";
    const result = getWindowsInstallCommand({
      optionals: { serverAddress, managerCa: windowsCa },
      urlPackage: 'https://example.com/package.msi',
      packageName: 'wazuh-agent-5.0.0.msi',
      name: 'windows',
    });
    expect(result).toContain(windowsCa);
  });
});
