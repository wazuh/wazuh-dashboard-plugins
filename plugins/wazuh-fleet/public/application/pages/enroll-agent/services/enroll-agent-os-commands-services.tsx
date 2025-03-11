import {
  scapeSpecialCharsForLinux,
  scapeSpecialCharsForMacOS,
  scapeSpecialCharsForWindows,
} from './wazuh-password-service';

const orderEnrollOptions = [
  'serverAddress',
  'username',
  'password',
  'agentName',
  'verificationMode',
  'communicationsAPIUrl',
  'enrollmentKey',
];

export interface GenerateInstallCommandFromFormOptions {
  version: string;
  [key: string]: any;
}

export type GenerateInstallCommandFromFormForm = Record<
  string,
  { value: string }
>;

const createEnrollOptionCreator =
  (option: string) =>
  (
    value: any,
    _form: GenerateInstallCommandFromFormOptions,
    _options: GenerateInstallCommandFromFormForm,
  ) =>
    `${option} '${value}'`;
const formFieldToEnrollOptions = {
  serverAddress: createEnrollOptionCreator('--enroll-url'),
  username: createEnrollOptionCreator('--user'),
  password: (
    value: any,
    form: GenerateInstallCommandFromFormForm,
    options: GenerateInstallCommandFromFormOptions,
  ) => {
    const property = '--password';

    if (form.operatingSystemSelection.value.startsWith('linux')) {
      return `${property} $'${options?.obfuscatePassword ? '*'.repeat(value.length) : scapeSpecialCharsForLinux(value)}'`;
    } else if (form.operatingSystemSelection.value.startsWith('macos')) {
      return `${property} '${options?.obfuscatePassword ? '*'.repeat(value.length) : scapeSpecialCharsForMacOS(value)}'`;
    } else if (form.operatingSystemSelection.value.startsWith('windows')) {
      return `${property} '${options?.obfuscatePassword ? '*'.repeat(value.length) : scapeSpecialCharsForWindows(value)}'`;
    }
  },
  verificationMode: createEnrollOptionCreator('--verification-mode'),
  agentName: createEnrollOptionCreator('--name'),
  communicationsAPIUrl: createEnrollOptionCreator('--connect-url'),
  enrollmentKey: createEnrollOptionCreator('--key'),
};

export function getEnrollOptions(
  form: GenerateInstallCommandFromFormForm,
  options: GenerateInstallCommandFromFormOptions,
) {
  return orderEnrollOptions
    .filter(
      option =>
        option in formFieldToEnrollOptions && Boolean(form[option].value),
    )
    .map(option =>
      formFieldToEnrollOptions[option](form[option].value, form, options),
    )
    .join(' ');
}

const packagesByOSArch = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  linux_deb_amd64: {
    install: (
      form: GenerateInstallCommandFromFormForm,
      options: GenerateInstallCommandFromFormOptions,
    ) => {
      const packageName = `wazuh-agent_${options.version}-1_amd64.deb`;

      return [
        // Download
        // `wget `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/${packageName}`, // TODO: enable when the packages are publically hosted
        // Install
        `sudo dpkg -i ./${packageName}`,
        // Enroll
        `sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent ${getEnrollOptions(form, options)}`,
      ].join(' && ');
    },
    start: (
      _form: GenerateInstallCommandFromFormForm,
      _options: GenerateInstallCommandFromFormOptions,
    ) =>
      `sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent`,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  linux_deb_arm64: {
    install: (
      form: GenerateInstallCommandFromFormForm,
      options: GenerateInstallCommandFromFormOptions,
    ) => {
      const packageName = `wazuh-agent_${options.version}-1_arm64.deb`;

      return [
        // Download
        // `wget `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/${packageName}`, // TODO: enable when the packages are publically hosted
        // Install
        `sudo dpkg -i ./${packageName}`,
        // Enroll
        `sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent ${getEnrollOptions(form, options)}`,
      ].join(' && ');
    },
    start: (
      _form: GenerateInstallCommandFromFormForm,
      _options: GenerateInstallCommandFromFormOptions,
    ) =>
      `sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent`,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  linux_rpm_amd64: {
    install: (
      form: GenerateInstallCommandFromFormForm,
      options: GenerateInstallCommandFromFormOptions,
    ) => {
      // const urlPackage = `https://packages.wazuh.com/4.x/yum/wazuh-agent-${options.version}-1.x86_64.rpm`;
      const packageName = `wazuh-agent-${options.version}-1.x86_64.rpm`;

      return [
        // Download
        // `curl -o ${packageName} ${urlPackage}`, // TODO: enable when the packages are publically hosted
        // Install
        `sudo rpm -ihv ${packageName}`,
        // Enroll
        `sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent ${getEnrollOptions(form, options)}`,
      ].join(' && ');
    },
    start: (
      _form: GenerateInstallCommandFromFormForm,
      _options: GenerateInstallCommandFromFormOptions,
    ) =>
      `sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent`,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  linux_rpm_arm64: {
    install: (
      form: GenerateInstallCommandFromFormForm,
      options: GenerateInstallCommandFromFormOptions,
    ) => {
      // const urlPackage = `https://packages.wazuh.com/4.x/yum/wazuh-agent-${options.version}-1.aarch64.rpm`;
      const packageName = `wazuh-agent-${options.version}-1.aarch64.rpm`;

      return [
        // Download
        // `curl -o ${packageName} ${urlPackage}`, // TODO: enable when the packages are publically hosted
        // Install
        `sudo rpm -ihv ${packageName}`,
        // Enroll
        `sudo /usr/share/wazuh-agent/bin/wazuh-agent --enroll-agent ${getEnrollOptions(form, options)}`,
      ].join(' && ');
    },
    start: (
      _form: GenerateInstallCommandFromFormForm,
      _options: GenerateInstallCommandFromFormOptions,
    ) =>
      `sudo systemctl daemon-reload\nsudo systemctl enable wazuh-agent\nsudo systemctl start wazuh-agent`,
  },
  windows: {
    install: (
      form: GenerateInstallCommandFromFormForm,
      options: GenerateInstallCommandFromFormOptions,
    ) => {
      // const urlPackage = `https://packages.wazuh.com/4.x/windows/wazuh-agent-${options.version}-1.msi`;
      const localPackagePath = `$env:tmp\\wazuh-agent.msi;`;

      return [
        // Download
        // `Invoke-WebRequest -Uri ${urlPackage} -OutFile ${localPackagePath}`, // TODO: enable when the packages are publically hosted
        // Install and enroll
        // https://stackoverflow.com/questions/1673967/how-to-run-an-exe-file-in-powershell-with-parameters-with-spaces-and-quotes
        `Start-Process msiexec.exe "/i ${localPackagePath} /q" -Wait; & 'C:\\Program Files\\wazuh-agent\\wazuh-agent.exe' --enroll-agent ${getEnrollOptions(
          form,
          options,
        )}`,
      ].join(' ');
    },
    start: (
      _form: GenerateInstallCommandFromFormForm,
      _options: GenerateInstallCommandFromFormOptions,
    ) => `NET START 'Wazuh Agent'`,
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  macos_intel64: {
    install: (
      form: GenerateInstallCommandFromFormForm,
      options: GenerateInstallCommandFromFormOptions,
    ) => {
      // const urlPackage = `https://packages.wazuh.com/4.x/macos/wazuh-agent-${options.version}-1.intel64.pkg`;
      const localPackageName = 'wazuh-agent.pkg';

      return [
        // Download
        // `curl -so wazuh-agent.pkg ${urlPackage}`, // TODO: enable when the packages are publically hosted
        // Install
        `sudo installer -pkg ./${localPackageName} -target /`,
        // Enroll
        `/Library/Application\\ Support/Wazuh\\ agent.app/bin/wazuh-agent --enroll-agent ${getEnrollOptions(form, options)}`,
      ].join(' && ');
    },
    start: () => `sudo /Library/Ossec/bin/wazuh-control start`,
  },

  // eslint-disable-next-line @typescript-eslint/naming-convention
  macos_arm64: {
    install: (
      form: GenerateInstallCommandFromFormForm,
      options: GenerateInstallCommandFromFormOptions,
    ) => {
      // const urlPackage = `https://packages.wazuh.com/4.x/macos/wazuh-agent-${options.version}-1.arm64.pkg`;
      const localPackageName = 'wazuh-agent.pkg';

      return [
        // Download
        // `curl -so wazuh-agent.pkg ${urlPackage}`,
        // Install
        `sudo installer -pkg ./${localPackageName} -target /`,
        // Enroll
        `/Library/Application\\ Support/Wazuh\\ agent.app/bin/wazuh-agent --enroll-agent ${getEnrollOptions(form, options)}`,
      ].join(' && ');
    },
    start: (
      _form: GenerateInstallCommandFromFormForm,
      _options: GenerateInstallCommandFromFormOptions,
    ) => `sudo /Library/Ossec/bin/wazuh-control start`,
  },
};

export function generateInstallCommandFromForm(
  form: GenerateInstallCommandFromFormForm,
  options: GenerateInstallCommandFromFormOptions,
) {
  return packagesByOSArch[
    form.operatingSystemSelection.value as keyof typeof packagesByOSArch
  ].install(form, options);
}

export function generateStartCommandFromForm(
  form: GenerateInstallCommandFromFormForm,
  options: GenerateInstallCommandFromFormOptions,
) {
  return packagesByOSArch[
    form.operatingSystemSelection.value as keyof typeof packagesByOSArch
  ].start(form, options);
}
