/**
 * Get the agent package url depending on the OS, architecture and the version
 * @param OSVersion
 * @param OSArchitecture
 * @param wazuhVersion
 */
const resolveRPMPackage = (
  OSVersion: string,
  OSArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${OSVersion}-${OSArchitecture}`) {
    case 'redhat5-i386':
      return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${wazuhVersion}-1.el5.i386.rpm`;
    case 'redhat5-x86_64':
      return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${wazuhVersion}-1.el5.x86_64.rpm`;
    case 'redhat6-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.i386.rpm`;
    case 'redhat6-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
    case 'redhat6-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
    case 'redhat6-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.armv7hl.rpm`;
    case 'redhat7-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.i386.rpm`;
    case 'redhat7-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
    case 'redhat7-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
    case 'redhat7-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.armv7hl.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveORACLELINUXPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case 'oraclelinux5-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.i386.rpm`;
    case 'oraclelinux5-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
    case 'oraclelinux5-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
    case 'oraclelinux5-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.armv7hl.rpm`;
    case 'oraclelinux5-powerpc':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.ppc64le.rpm`;
    case 'oraclelinux6-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.i386.rpm`;
    case 'oraclelinux6-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.aarch64.rpm`;
    case 'oraclelinux6-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case 'oraclelinux6-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveCENTPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case 'centos5-i386':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}.el5.i386.rpm`;
    case 'centos5-x86_64':
      return `https://packages.wazuh.com/4.x/yum/x86_64/wazuh-agent-${wazuhVersion}.el5.x86_64.rpm`;
    case 'centos6-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.i386.rpm`;
    case 'centos6-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.aarch64.rpm`;
    case 'centos6-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case 'centos6-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    case 'centos7-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.i386.rpm`;
    case 'centos7-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.aarch64.rpm`;
    case 'centos7-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case 'centos7-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    case 'centos7-powerpc':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.ppc64le.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveSUSEPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case 'suse11-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.i386.rpm`;
    case 'suse11-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case 'suse12-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.i386.rpm`;
    case 'suse12-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.aarch64.rpm`;
    case 'suse12-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case 'suse12-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    case 'suse12-powerpc':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.ppc64le.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveFEDORAPachage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case '22-i386':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}-1.el5.i386.rpm`;
    case '22-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
    case '22-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case '22-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    case '22-powerpc':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.ppc64le.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveAMAZONLPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case '1-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.i386.rpm`;
    case '1-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.aarch64.rpm`;
    case '1-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case '1-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    case '1-powerpc':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.ppc64le.rpm`;
    case '2-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.i386.rpm`;
    case '2-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.aarch64.rpm`;
    case '2-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case '2-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    case '2-powerpc':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.ppc64le.rpm`;
    case 'amazonlinux2022-i386':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.i386.rpm`;
    case 'amazonlinux2022-aarch64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
    case 'amazonlinux2022-x86_64':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
    case 'amazonlinux2022-armhf':
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.armv7hl.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
  }
};

/**
 * Get the agent package url depending on the architecture and the version
 * @param OSArchitecture
 * @param wazuhVersion
 */
const resolveDEBPackage = (OSArchitecture: string, wazuhVersion: string) => {
  switch (`${OSArchitecture}`) {
    case 'i386':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_i386.deb`;
    case 'aarch64':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_amd64.deb`;
    case 'armhf':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_armhf.deb`;
    case 'x86_64':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_arm64.deb`;
    case 'powerpc':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}.ppc64le.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_amd64.deb`;
  }
};

/**
 *
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveRASPBIANPackage = (
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedArchitecture}`) {
    case 'busterorgreater-i386':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_i386.deb`;
    case 'busterorgreater-aarch64':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_amd64.deb`;
    case 'busterorgreater-armhf':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_armhf.deb`;
    case 'busterorgreater-x86_64':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_arm64.deb`;
    case 'busterorgreater-powerpc':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}.ppc64le.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_amd64.deb`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveUBUNTUPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case 'i386':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_i386.deb`;
    case 'aarch64':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_amd64.deb`;
    case 'armhf':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_armhf.deb`;
    case 'x86_64':
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_arm64.deb`;
    default:
      return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}_amd64.deb`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveOPENSUSEPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case 'leap15-i386':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
    case 'leap15-x86_64':
      return `https://packages.wazuh.com/4.x/yum/x86_64/wazuh-agent-${wazuhVersion}.armv7hl.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}.x86_64.rpm`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveSOLARISPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case 'solaris10-i386':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}-sol10-i386.pkg`;
    case 'solaris10-spark':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}-sol10-sparc.pkg`;
    case 'solaris11-i386':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}-sol11-i386.p5p`;
    case 'solaris11-spark':
      return `https://packages.wazuh.com/4.x/yum/x86_64/wazuh-agent-${wazuhVersion}-sol11-sparc.p5p`;
    default:
      return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-sol11-sparc.p5p`;
  }
};

/**
 *
 * @param selectedVersion
 * @param selectedArchitecture
 * @param wazuhVersion
 */
const resolveAIXPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case '6.1 TL9-powerpc':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}.aix.ppc.rpm`;
    default:
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}.aix.ppc.rpm`;
  }
};

const resolveHPPackage = (
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (`${selectedVersion}-${selectedArchitecture}`) {
    case '11.31-itanium2':
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}-hpux-11v3-ia64.tar`;
    default:
      return `https://packages.wazuh.com/4.x/yum/i386/wazuh-agent-${wazuhVersion}-hpux-11v3-ia64.tar`;
  }
};

/**
 * Get the agent package url depending on the os version selected
 * @param OSVersion
 * @param selectedVersion
 * @param OSArchitecture
 * @param wazuhVersion
 */
export const optionalPackages = (
  selectedOS: string,
  selectedVersion: string,
  selectedArchitecture: string,
  wazuhVersion: string,
) => {
  switch (selectedOS) {
    case 'rpm':
      return resolveRPMPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'cent':
      return resolveCENTPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'deb':
      return resolveDEBPackage(selectedArchitecture, wazuhVersion);
    case 'ubu':
      return resolveUBUNTUPackage(
        selectedVersion,
        selectedArchitecture,
        wazuhVersion,
      );
    case 'open':
      return resolveOPENSUSEPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'sol':
      return resolveSOLARISPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'aix':
      return resolveAIXPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'hp':
      return resolveHPPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'amazonlinux':
      return resolveAMAZONLPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'fedora':
      return resolveFEDORAPachage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'oraclelinux':
      return resolveORACLELINUXPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'suse':
      return resolveSUSEPackage(selectedVersion, selectedArchitecture, wazuhVersion);
    case 'raspbian':
      return resolveRASPBIANPackage(selectedArchitecture, wazuhVersion);
    default:
      return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
  }
};
