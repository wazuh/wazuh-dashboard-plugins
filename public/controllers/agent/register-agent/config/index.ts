export interface iButton {
  id: string;
  label: string;
  versionsBtns?: iButton[];
  architectureBtns?: iButton[] | ((OSVersion: string) => iButton[]);
}

const architectureButtons: iButton[] = [
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

const architectureButtonsWithPPC64LE: iButton[] = [
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
  {
    id: 'powerpc',
    label: 'PowerPC',
  },
];


const architecturei386Andx86_64: iButton[] = [
  {
    id: 'i386',
    label: 'i386',
  },
  {
    id: 'x86_64',
    label: 'x86_64',
  },
];

const getArchitectureButtons = (OSVersion: string): iButton[] => {
  if (['centos5', 'redhat5', 'oraclelinux5', 'suse11'].includes(OSVersion)) {
    return architecturei386Andx86_64;
  }

  if (
    [
      'centos6',
      'oraclelinux6',
      'amazonlinux1',
      'redhat6',
      'redhat7',
      'amazonlinux2022',
      'debian7',
      'debian8',
      'ubuntu14',
      'ubuntu15',
      'ubuntu16',
    ].includes(OSVersion)
  ) {
    return architectureButtons;
  }

  if (
    [
      'centos7',
      'amazonlinux2',
      'suse12',
      '22',
      'debian9',
      'debian10',
      'busterorgreater',
    ].includes(OSVersion)
  ) {
    return architectureButtonsWithPPC64LE;
  }

  return [];
};

/**
 * Order the OS Buttons Alphabetically by label
 * @param a
 * @param b
 * @returns
 */
const orderOSAlphabetically = (a: iButton, b: iButton) => {
  if (a.label.toUpperCase() < b.label.toUpperCase()) {
    return -1;
  }
  if (a.label.toUpperCase() > b.label.toUpperCase()) {
    return 1;
  }
  return 0;
};

const buttonsConfig = [
  {
    id: 'rpm',
    label: 'Red Hat Enterprise Linux',
    versionsBtns: [
      {
        id: 'redhat5',
        label: 'Red Hat 5',
      },
      {
        id: 'redhat6',
        label: 'Red Hat 6',
      },
      {
        id: 'redhat7',
        label: 'Red Hat 7 or higher',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
  {
    id: 'cent',
    label: 'CentOS',
    versionsBtns: [
      {
        id: 'centos5',
        label: 'Centos 5',
      },
      {
        id: 'centos6',
        label: 'Centos 6',
      },
      {
        id: 'centos7',
        label: 'Centos 7 or higher',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
  {
    id: 'deb',
    label: 'Debian',
    versionsBtns: [
      {
        id: 'debian7',
        label: 'Debian 7',
      },
      {
        id: 'debian8',
        label: 'Debian 8',
      },
      {
        id: 'debian9',
        label: 'Debian 9',
      },
      {
        id: 'debian10',
        label: 'Debian 10 or higher',
      },
    ],
  },
  {
    id: 'ubu',
    label: 'Ubuntu',
    versionsBtns: [
      {
        id: 'ubuntu14',
        label: 'Ubuntu 14',
      },
      {
        id: 'ubuntu15',
        label: 'Ubuntu 15',
      },
      {
        id: 'ubuntu16',
        label: 'Ubuntu 16 or higher',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
  {
    id: 'win',
    label: 'Windows',
    versionsBtns: [
      {
        id: 'windowsxp',
        label: 'Windows XP',
      },
      {
        id: 'windows8',
        label: 'Windows 8 or higher',
      },
    ],
    architectureBtns: [
      {
        id: 'i386',
        label: 'i386',
      },
    ]
  },
  {
    id: 'macos',
    label: 'macOS',
    versionsBtns: [
      {
        id: 'sierra',
        label: 'Sierra',
      },
      {
        id: 'highSierra',
        label: 'High Sierra',
      },
      {
        id: 'mojave',
        label: 'Mojave',
      },
      {
        id: 'catalina',
        label: 'Catalina',
      },
      {
        id: 'bigSur',
        label: 'Big Sur',
      },
      {
        id: 'monterrey',
        label: 'Monterrey',
      },
    ],
    architectureBtns: [
      {
        id: 'intel',
        label: 'Intel',
      },
      {
        id: 'applesilicon',
        label: 'Apple Silicon',
      },
    ],
  },
  {
    id: 'open',
    label: 'OpenSuse',
    versionsBtns: [
      {
        id: 'leap15',
        label: 'Leap 15 or higher',
      },
    ],
    architectureBtns: [
      {
        id: 'x86_64',
        label: 'x86_64',
      },
      {
        id: 'ARM64',
        label: 'ARM64',
      },
    ],
  },
  {
    id: 'sol',
    label: 'Solaris',
    versionsBtns: [
      {
        id: 'solaris10',
        label: 'Solaris 10',
      },
      {
        id: 'solaris11',
        label: 'Solaris 11',
      },
    ],
    architectureBtns: [
      {
        id: 'i386',
        label: 'i386',
      },
      {
        id: 'sparc',
        label: 'SPARC',
      },
    ],
  },
  {
    id: 'aix',
    label: 'AIX',
    versionsBtns: [
      {
        id: '6.1 TL9',
        label: '6.1 TL9 or higher',
      },
    ],
    architectureBtns: [
      {
        id: 'powerpc',
        label: 'PowerPC',
      },
    ],
  },
  {
    id: 'hp',
    label: 'HP-UX',
    versionsBtns: [
      {
        id: '11.31',
        label: '11.31 or higher',
      },
    ],
    architectureBtns: [
      {
        id: 'itanium2',
        label: 'Itanium2',
      },
    ],
  },
  {
    id: 'amazonlinux',
    label: 'Amazon Linux',
    versionsBtns: [
      {
        id: 'amazonlinux1',
        label: 'Amazon Linux 1',
      },
      {
        id: 'amazonlinux2',
        label: 'Amazon Linux 2',
      },
      {
        id: 'amazonlinux2022',
        label: 'Amazon Linux 2022',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
  {
    id: 'fedora',
    label: 'Fedora',
    versionsBtns: [
      {
        id: '22',
        label: '22 or later',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
  {
    id: 'oraclelinux',
    label: 'Oracle Linux',
    versionsBtns: [
      {
        id: 'oraclelinux5',
        label: '5',
      },
      {
        id: 'oraclelinux6',
        label: '6 or later',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
  {
    id: 'suse',
    label: 'SUSE',
    versionsBtns: [
      {
        id: 'suse11',
        label: '11',
      },
      {
        id: 'suse12',
        label: '12',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
  {
    id: 'raspbian',
    label: 'Raspbian OS',
    versionsBtns: [
      {
        id: 'busterorgreater',
        label: 'Buster or greater',
      },
    ],
    architectureBtns: (OSVersion: string) => getArchitectureButtons(OSVersion),
  },
].sort(orderOSAlphabetically);

export {
  buttonsConfig,
  architectureButtons,
  architecturei386Andx86_64,
  architectureButtonsWithPPC64LE
};

const codeBlock = {
  zIndex: '100',
};

export { codeBlock };
