import { tOptionalParameters } from '../core/config/os-commands-definitions';
import {
  IOptionalParameters,
  tOSEntryInstallCommand,
  tOSEntryLocalInstallCommand,
  tOSEntryProps,
} from '../core/register-commands/types';
import { tOperatingSystem } from '../hooks/use-register-agent-commands.test';

export const getAllOptionals = (
  optionals: IOptionalParameters<tOptionalParameters>,
  osName?: tOperatingSystem['name'],
) => {
  // create paramNameOrderList, which is an array of the keys of optionals add interface
  const paramNameOrderList: (keyof IOptionalParameters<tOptionalParameters>)[] =
    [
      'enrollmentToken',
      'serverAddress',
      'wazuhPassword',
      'agentGroups',
      'agentName',
      'sslVerification',
    ];

  if (!optionals) return '';
  let paramsText = Object.entries(paramNameOrderList).reduce(
    (acc, [key, value]) => {
      if (optionals[value]) {
        acc += `${optionals[value]} `;
      }
      return acc;
    },
    '',
  );

  return paramsText;
};

export const getAllOptionalsMacos = (
  optionals: IOptionalParameters<tOptionalParameters>,
) => {
  // create paramNameOrderList, which is an array of the keys of optionals add interface
  const paramNameOrderList: (keyof IOptionalParameters<tOptionalParameters>)[] =
    [
      'enrollmentToken',
      'serverAddress',
      'agentGroups',
      'agentName',
      'wazuhPassword',
      'sslVerification',
    ];

  if (!optionals) return '';

  const paramsValueList = [];

  paramNameOrderList.forEach(paramName => {
    if (optionals[paramName] && optionals[paramName] !== '') {
      paramsValueList.push(optionals[paramName]);
    }
  });

  if (paramsValueList.length) {
    return paramsValueList.join(' && ');
  }

  return '';
};

/******* DEB *******/

type tLinuxInstallCommand = tOSEntryInstallCommand<tOptionalParameters> & {
  gpgKeyUrl: string;
};

type tDEBInstallCommand = tLinuxInstallCommand & {
  aptSource: string;
};

const DEB_KEYRING = '/usr/share/keyrings/wazuh.asc';

// dpkg checks no signature: apt verifies the signed index; the package must match its SHA-256.
const getDEBVerifyCommand = (packageName: string, aptSource: string) =>
  `d=$(mktemp -d) && chmod 755 $d && echo "deb [signed-by=${DEB_KEYRING}] ${aptSource} main" > $d/wazuh.list && echo "Dir::Etc::SourceList \\"$d/wazuh.list\\"; Dir::Etc::SourceParts \\"$d/lists\\"; Dir::State::Lists \\"$d/lists\\"; Dir::Cache \\"$d\\";" > $d/apt.conf && sudo mkdir -m 755 $d/lists $d/lists/partial && sudo apt-get update -qq -c $d/apt.conf && echo "$(sudo apt-cache -c $d/apt.conf show wazuh-agent | awk -v f=/${packageName} '/^Filename:/{x=substr($2,length($2)-length(f)+1)==f} /^$/{x=0} x&&/^SHA256:/{print $2}')  ${packageName}" | sha256sum -c --quiet && sudo rm -rf $d`;

/* Installs a package already on the endpoint, from the current folder: hosts
without Internet access cannot reach the repository the other commands use. */
export const getDEBLocalInstallCommand = (
  props: tOSEntryLocalInstallCommand<tOptionalParameters>,
) => {
  const { optionals, packageName } = props;
  return `sudo ${
    optionals && getAllOptionals(optionals)
  }dpkg -i ./${packageName}`;
};

const getDEBInstallCommand = (props: tDEBInstallCommand) => {
  const { urlPackage, packageName, gpgKeyUrl, aptSource } = props;
  return `sudo wget -qO ${DEB_KEYRING} ${gpgKeyUrl} && sudo chmod 644 ${DEB_KEYRING} && wget ${urlPackage} && ${getDEBVerifyCommand(
    packageName,
    aptSource,
  )} && ${getDEBLocalInstallCommand(props)}`;
};

export const getDEBAMD64InstallCommand = (props: tDEBInstallCommand) =>
  getDEBInstallCommand(props);

export const getDEBARM64InstallCommand = (props: tDEBInstallCommand) =>
  getDEBInstallCommand(props);

/******* RPM *******/

export const getRPMLocalInstallCommand = (
  props: tOSEntryLocalInstallCommand<tOptionalParameters>,
) => {
  const { optionals, packageName } = props;
  return `sudo ${
    optionals && getAllOptionals(optionals)
  }rpm -ihv ./${packageName}`;
};

const getRPMInstallCommand = (props: tLinuxInstallCommand) => {
  const { optionals, urlPackage, packageName, gpgKeyUrl } = props;
  // rpm -K rejects bad or unknown signatures; the grep rejects unsigned packages.
  return `sudo rpm --import ${gpgKeyUrl} && curl -o ${packageName} ${urlPackage} && rpm -K ${packageName} && LC_ALL=C rpm -Kv ${packageName} | grep -q 'Signature, key ID [0-9a-f]*: OK' && sudo ${
    optionals && getAllOptionals(optionals)
  }rpm -ihv ${packageName}`;
};

export const getRPMAMD64InstallCommand = (props: tLinuxInstallCommand) =>
  getRPMInstallCommand(props);

export const getRPMARM64InstallCommand = (props: tLinuxInstallCommand) =>
  getRPMInstallCommand(props);

/******* Linux *******/

// Start command
export const getLinuxStartCommand = (
  _props: tOSEntryProps<tOptionalParameters>,
) => {
  return `sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent`;
};

/******** Windows ********/

/* PowerShell does not wait for msiexec.exe, a GUI-subsystem executable, unless its output
is piped. Waiting lets the start command find the service, and the exit code shows an
install that failed silently because of /q. Start-Process is not used because it passes
the arguments as a single string, so the quotes of the PROP='value' options would reach
msiexec. */
const WINDOWS_INSTALLER_WAIT =
  '| Out-Null; if ($LASTEXITCODE -ne 0) { Write-Error "The installation failed with exit code $LASTEXITCODE." }';

export const getWindowsInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage, packageName, name } = props;
  return `Invoke-WebRequest -Uri ${urlPackage} -OutFile \$env:tmp\\${packageName}; msiexec.exe /i \$env:tmp\\${packageName} /q ${
    optionals && getAllOptionals(optionals, name)
  }${WINDOWS_INSTALLER_WAIT}`;
};

export const getWindowsLocalInstallCommand = (
  props: tOSEntryLocalInstallCommand<tOptionalParameters>,
) => {
  const { optionals, packageName, name } = props;
  return `msiexec.exe /i .\\${packageName} /q ${
    optionals && getAllOptionals(optionals, name)
  }${WINDOWS_INSTALLER_WAIT}`;
};

export const getWindowsStartCommand = (
  _props: tOSEntryProps<tOptionalParameters>,
) => {
  return `NET START Wazuh`;
};

/******** MacOS ********/

export const transformOptionalsParamatersMacOSCommand = (command: string) => {
  return command
    .replace(/\' ([a-zA-Z])/g, "' && $1") // Separate environment variables with &&
    .replace(/\"/g, '\\"') // Escape double quotes
    .trim();
};

/* The installer reads its settings from /tmp/wazuh_envs, so the command writes
them there before it runs. */
export const getMacOsLocalInstallCommand = (
  props: tOSEntryLocalInstallCommand<tOptionalParameters>,
) => {
  const { optionals, packageName } = props;

  let optionalsForCommand = { ...optionals };
  if (optionalsForCommand?.wazuhPassword) {
    /**
     * We use the JSON.stringify to prevent that the scaped specials characters will be removed
     * and maintain the format of the password
      The JSON.stringify maintain the password format but adds " to wrap the characters
    */
    const scapedPasswordLength = JSON.stringify(
      optionalsForCommand?.wazuhPassword,
    ).length;
    // We need to remove the " added by JSON.stringify
    optionalsForCommand.wazuhPassword = `${JSON.stringify(
      optionalsForCommand?.wazuhPassword,
    ).substring(1, scapedPasswordLength - 1)}`;
  }

  // Set macOS installation script with environment variables
  const optionalsText =
    optionalsForCommand && getAllOptionalsMacos(optionalsForCommand);
  const macOSInstallationOptions = transformOptionalsParamatersMacOSCommand(
    optionalsText || '',
  );

  // If no variables are set, the echo will be empty
  const macOSInstallationSetEnvVariablesScript = macOSInstallationOptions
    ? `echo "${macOSInstallationOptions}" > /tmp/wazuh_envs && `
    : ``;

  // Merge environment variables with installation script
  return `${macOSInstallationSetEnvVariablesScript}sudo installer -pkg ./${packageName} -target /`;
};

export const getMacOsInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { urlPackage, packageName } = props;
  return `curl -so ${packageName} ${urlPackage} && ${getMacOsLocalInstallCommand(
    props,
  )}`;
};

export const getMacosStartCommand = (
  _props: tOSEntryProps<tOptionalParameters>,
) => {
  return 'sudo launchctl load /Library/LaunchDaemons/com.wazuh.agent.plist';
};
