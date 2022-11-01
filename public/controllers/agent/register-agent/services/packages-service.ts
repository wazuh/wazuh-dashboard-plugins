const resolveRPMPackage = (OSVersion: string, OSArchitecture: string, wazuhVersion: string) => {
    switch (`${OSVersion}-${OSArchitecture}`) {
      case 'centos5-i386':
        return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${wazuhVersion}-1.el5.i386.rpm`;
      case 'centos5-x86_64':
        return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${wazuhVersion}-1.el5.x86_64.rpm`;
      case 'redhat5-i386':
        return `https://packages.wazuh.com/4.x/yum5/i386/wazuh-agent-${wazuhVersion}-1.el5.i386.rpm`;
      case 'redhat5-x86_64':
        return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${wazuhVersion}-1.el5.x86_64.rpm`;
      case 'centos6-i386':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.i386.rpm`;
      case 'centos6-aarch64':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
      case 'centos6-x86_64':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
      case 'centos6-armhf':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.armv7hl.rpm`;
      case 'redhat6-i386':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.i386.rpm`;
      case 'redhat6-aarch64':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.aarch64.rpm`;
      case 'redhat6-x86_64':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
      case 'redhat6-armhf':
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.armv7hl.rpm`;
      default:
        return `https://packages.wazuh.com/4.x/yum/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
    }
  }

  const resolveDEBPackage = (OSArchitecture: string, wazuhVersion: string) => {
    switch (`${OSArchitecture}`) {
      case 'i386':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}-1_i386.deb`;
      case 'aarch64':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}-1_arm64.deb`;
      case 'armhf':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}-1_armhf.deb`;
      case 'x86_64':
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}-1_amd64.deb`;
      default:
        return `https://packages.wazuh.com/4.x/apt/pool/main/w/wazuh-agent/wazuh-agent_${wazuhVersion}-1_amd64.deb`;
    }
  }

  export const optionalPackages = (OSVersion: string, OSArchitecture: string, wazuhVersion: string) => {
    switch (OSVersion) {
      case 'rpm':
        return resolveRPMPackage(OSVersion, OSArchitecture, wazuhVersion);
      case 'deb':
        return resolveDEBPackage(OSArchitecture, wazuhVersion);
      default:
        return `https://packages.wazuh.com/4.x/yum5/x86_64/wazuh-agent-${wazuhVersion}-1.x86_64.rpm`;
    }
  }
