interface iButtons {
  id: string;
  label: string;
}

const architectureButtons: iButtons[] = [
  {
    id: 'i386',
    label: 'i386'
  },
];

const architectureButtonsWithPPC64LE: iButtons[] = [
  {
    id: 'i386',
    label: 'i386'
  }
];


const architectureButtonsi386: iButtons[] = [
  {
    id: 'i386',
    label: 'i386',
  }
];

const architecturei386Andx86_64: iButtons[] = [
  {
    id: 'i386',
    label: 'i386'
  },
];

const architectureButtonsSolaris: iButtons[] = [
  {
    id: 'i386',
    label: 'i386',
  },
  {
    id: 'sparc',
    label: 'SPARC',
  }
];

const architectureButtonsMacos: iButtons[] = [
  {
    id: 'intel',
    label: 'Intel'
  },
  {
    id: 'applesilicon',
    label: 'Apple Silicon'
  }
]

const architectureButtonsOpenSuse: iButtons[] = [
  {
    id: 'x86_64',
    label: 'x86_64',
  },
  {
    id: 'ARM64',
    label: 'ARM64',
  }
];

const architectureButtonsAix: iButtons[] = [
  {
    id: 'powerpc',
    label: 'PowerPC',
  }
];

const architectureButtonsHpUx: iButtons[] = [
  {
    id: 'itanium2',
    label: 'Itanium2',
  }
];

const versionButtonAmazonLinux: iButtons[] = [
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
  }
]

const versionButtonsRedHat: iButtons[] = [
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
];

const versionButtonsCentos: iButtons[] = [
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
];

const versionButtonsDebian: iButtons[] = [
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
  }
];

const versionButtonFedora: iButtons[] = [
  {
    id: '22',
    label: '22 or later'
  }
]

const versionButtonsUbuntu: iButtons[] = [
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
  }
];

const versionButtonsWindows: iButtons[] = [
  {
    id: 'windowsxp',
    label: 'Windows XP',
  },
  {
    id: 'windows8',
    label: 'Windows 8 or higher',
  }
];

const versionButtonsSuse: iButtons[] = [
  {
    id: 'suse11',
    label: '11',
  },
  {
    id: 'suse12',
    label: '12',
  }
];

const versionButtonsMacOS: iButtons[] = [
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
];

const versionButtonsOpenSuse: iButtons[] = [
  {
    id: 'leap15',
    label: 'Leap 15 or higher',
  }
];

const versionButtonsSolaris: iButtons[] = [
  {
    id: 'solaris10',
    label: 'Solaris 10',
  },
  {
    id: 'solaris11',
    label: 'Solaris 11',
  }
];

const versionButtonsAix: iButtons[] = [
  {
    id: '6.1 TL9',
    label: '6.1 TL9 or higher',
  }
];

const versionButtonsHPUX: iButtons[] = [
  {
    id: '11.31',
    label: '11.31 or higher',
  }
];

const versionButtonsOracleLinux: iButtons[] = [
  {
    id: 'oraclelinux5',
    label: '5',
  },
  {
    id: 'oraclelinux6',
    label: '6 or later',
  }
];

const versionButtonsRaspbian: iButtons[] = [
  {
    id: 'busterorgreater',
    label: 'Buster or greater',
  }
];

/**
 * Order the OS Buttons Alphabetically by label
 * @param a 
 * @param b 
 * @returns 
 */
const orderOSAlphabetically = (a: iButtons, b: iButtons) => {
  if (a.label.toUpperCase() < b.label.toUpperCase()) {
    return -1;
  }
  if (a.label.toUpperCase() > b.label.toUpperCase()) {
    return 1;
  }
  return 0;
}

const osButtons = [
  {
    id: 'rpm',
    label: 'Red Hat Enterprise Linux',
  },
  {
    id: 'cent',
    label: 'CentOS',
  },
  {
    id: 'deb',
    label: 'Debian',
  },
  {
    id: 'ubu',
    label: 'Ubuntu',
  },
  {
    id: 'win',
    label: 'Windows',
  },
  {
    id: 'macos',
    label: 'macOS',
  },
  {
    id: 'open',
    label: 'OpenSuse',
  },
  {
    id: 'sol',
    label: 'Solaris',
  },
  {
    id: 'aix',
    label: 'AIX',
  },
  {  
    id: 'hp',
    label: 'HP-UX',
  },
  {  
    id: 'amazonlinux',
    label: 'Amazon Linux',
  },
  {  
    id: 'fedora',
    label: 'Fedora',
  },
  {  
    id: 'oraclelinux',
    label: 'Oracle Linux',
  },
  {  
    id: 'suse',
    label: 'SUSE',
  },
  {  
    id: 'raspbian',
    label: 'Raspbian OS',
  },
].sort(orderOSAlphabetically);

export { architectureButtons, architecturei386Andx86_64, versionButtonsRaspbian, versionButtonsSuse, architectureButtonsWithPPC64LE, versionButtonsOracleLinux, versionButtonFedora, versionButtonsRedHat, versionButtonsCentos, architectureButtonsMacos, osButtons, versionButtonsDebian, versionButtonsUbuntu, versionButtonAmazonLinux, versionButtonsWindows, versionButtonsMacOS, versionButtonsOpenSuse, versionButtonsSolaris, versionButtonsAix, versionButtonsHPUX, architectureButtonsi386, architectureButtonsSolaris, architectureButtonsAix, architectureButtonsHpUx, architectureButtonsOpenSuse };

const codeBlock = {
  zIndex: '100',
};

export { codeBlock };
