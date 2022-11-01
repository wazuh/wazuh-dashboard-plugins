const architectureButtons = [
    {
      id: 'i386',
      label: 'i386',
    },
    {
      id: 'x86_64',
      label: 'x86_64',
    },
    {
      id: 'armhf',
      label: 'armhf',
    },
    {
      id: 'aarch64',
      label: 'aarch64',
    },
  ];
  const architectureCentos5OrRedHat5 = [
    {
      id: 'i386',
      label: 'i386',
    },
    {
      id: 'x86_64',
      label: 'x86_64',
    },
  ];
  
  const versionButtonsCentosOrRedHat = [
    {
      id: 'centos5',
      label: 'CentOS5',
    },
    {
      id: 'centos6',
      label: 'CentOS6 or higher',
    },
    {
      id: 'redhat5',
      label: 'Red Hat 5',
    },
    {
      id: 'redhat6',
      label: 'Red Hat 6 or higher',
    },
  ];
  
  const osButtons = [
    {
      id: 'rpm',
      label: 'Red Hat / CentOS',
    },
    {
      id: 'deb',
      label: 'Debian / Ubuntu',
    },
    {
      id: 'win',
      label: 'Windows',
    },
    {
      id: 'macos',
      label: 'MacOS',
    },
  ];
  
  const sysButtons = [
    {
      id: 'systemd',
      label: 'Systemd',
    },
    {
      id: 'sysV',
      label: 'SysV Init',
    },
  ];

export { architectureButtons, architectureCentos5OrRedHat5, versionButtonsCentosOrRedHat, osButtons, sysButtons };