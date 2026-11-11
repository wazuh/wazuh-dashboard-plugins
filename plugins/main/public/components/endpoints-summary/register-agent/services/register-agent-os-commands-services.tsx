import { tOptionalParameters } from '../core/config/os-commands-definitions';
import {
  IOptionalParameters,
  tOSEntryInstallCommand,
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

const DEB_KEYRING = '/usr/share/keyrings/wazuh.gpg';

const getDEBImportKeyCommand = (gpgKeyUrl: string) =>
  `wget -qO - ${gpgKeyUrl} | sudo gpg --no-default-keyring --keyring gnupg-ring:${DEB_KEYRING} --import && sudo chmod 644 ${DEB_KEYRING}`;

// dpkg checks no signature: check the embedded dpkg-sig one (signed member list, SHA-1 sums).
const getDEBVerifyCommand = (packageName: string) =>
  `(f=$PWD/${packageName} && cd "$(mktemp -d)" && ar x "$f" && gpgv --keyring ${DEB_KEYRING} -o signed _gpgbuilder && awk '/^\\t/{print $2"  "$4}' signed > sums && [ "$(ar t "$f" | grep -v '^_')" = "$(cut -d' ' -f3 sums)" ] && sha1sum -c --quiet sums && rm -rf "$PWD")`;

const getDEBInstallCommand = (props: tLinuxInstallCommand) => {
  const { optionals, urlPackage, packageName, gpgKeyUrl } = props;
  return `${getDEBImportKeyCommand(
    gpgKeyUrl,
  )} && wget ${urlPackage} && ${getDEBVerifyCommand(packageName)} && sudo ${
    optionals && getAllOptionals(optionals)
  }dpkg -i ./${packageName}`;
};

export const getDEBAMD64InstallCommand = (props: tLinuxInstallCommand) =>
  getDEBInstallCommand(props);

export const getDEBARM64InstallCommand = (props: tLinuxInstallCommand) =>
  getDEBInstallCommand(props);

/******* RPM *******/

const getRPMInstallCommand = (props: tLinuxInstallCommand) => {
  const { optionals, urlPackage, packageName, gpgKeyUrl } = props;
  return `sudo rpm --import ${gpgKeyUrl} && curl -o ${packageName} ${urlPackage} && sudo ${
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

export const getMacOsInstallCommand = (
  props: tOSEntryInstallCommand<tOptionalParameters>,
) => {
  const { optionals, urlPackage, packageName } = props;

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
  const macOSInstallationScript = `curl -so ${packageName} ${urlPackage} && ${macOSInstallationSetEnvVariablesScript}sudo installer -pkg ./${packageName} -target /`;
  return macOSInstallationScript;
};

export const getMacosStartCommand = (
  _props: tOSEntryProps<tOptionalParameters>,
) => {
  return 'sudo launchctl load /Library/LaunchDaemons/com.wazuh.agent.plist';
};
