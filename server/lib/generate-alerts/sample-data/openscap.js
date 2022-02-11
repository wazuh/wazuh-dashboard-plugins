/*
 * Wazuh app - OpenSCAP sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// OpenSCAP
export const scanProfileTitle = ["xccdf_org.ssgproject.content_profile_standard", "xccdf_org.ssgproject.content_profile_pci-dss", "xccdf_org.ssgproject.content_profile_common", "xccdf_org.ssgproject.content_profile_anssi_np_nt28_minimal"];
export const checkSeverity = ["low", "medium", "high"];
export const checkResult = ["fail"];
export const scanContent = ["ssg-centos-7-ds.xml", "ssg-centos-6-ds.xml", "ssg-rhel6-ds.xml", "ssg-ubuntu18-ds.xml", "ssg-debian-ds.xml", "ssg-fedora-ds.xml"];
export const checkTitle = ["Record Attempts to Alter the localtime File", "Record Attempts to Alter Time Through clock_settime", "Ensure auditd Collects Unauthorized Access Attempts to Files (unsuccessful)", "Ensure auditd Collects System Administrator Actions", "Ensure auditd Collects File Deletion Events by User"];

export const decoder = {
  parent: "oscap",
  name: "oscap"
};

export const location = 'wodle_open-scap';

export const data = [
  {
    // "input": {
    //   "type": "log"
    // },
    "data": {
      "oscap": {
        "scan": {
          "score": "99.814812",
          "profile": {
            "id": "No profile",
            "title": "No profile"
          },
          "id": "0001587604016",
          "content": "cve-redhat-7-ds.xml",
          "benchmark": {
            "id": "xccdf_com.redhat.rhsa_benchmark_generated-xccdf"
          }
        }
      }
    },
    "rule": {
      "firedtimes": 1,
      "mail": false,
      "level": 3,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP Report overview.",
      "groups": ["oscap","oscap-report"],
      "id": "81540",
      "nist_800_53": ["CM.1"]
    },
    "full_log": "oscap: msg: \"xccdf-overview\", scan-id: \"{data.oscap.scan.id}\", content: \"{data.oscap.scan.content}\", benchmark-id: \"{data.oscap.scan.benhmark.id}\", profile-id: \"{data.oscap.scan.profile.id}\", profile-title: \"{data.oscap.scan.profile.title}\", score: \"{data.oscap.scan.score}\".",
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "score": "75.000000",
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        }
      }
    },
    "rule": {
      "firedtimes": 2,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP Report overview: Score less than 80",
      "groups": ["oscap","oscap-report"],
      "id": "81542",
      "nist_800_53": ["CM.1"]
    },
    "full_log": "oscap: msg: \"xccdf-overview\", scan-id: \"{data.oscap.scan.id}\", content: \"{data.oscap.scan.content}\", benchmark-id: \"{data.oscap.scan.benhmark.id}\", profile-id: \"{data.oscap.scan.profile.id}\", profile-title: \"{data.oscap.scan.profile.title}\", score: \"{data.oscap.scan.score}\".",
    "timestamp": "2020-04-23T01:06:56.060+0000"
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "No profile",
            "title": "No profile"
          },
          "id": "0001587604016",
          "content": "cve-redhat-7-ds.xml",
          "benchmark": {
            "id": "xccdf_com.redhat.rhsa_benchmark_generated-xccdf"
          }
        },
        "check": {
          "result": "fail",
          "severity": "high",
          "identifiers": "CVE-2016-5195 (http://cve.mitre.org), CVE-2016-7039 (http://cve.mitre.org), CVE-2016-8666 (http://cve.mitre.org)",
          "oval": {
            "id": "oval:com.redhat.rhsa:def:20170372"
          },
          "id": "xccdf_com.redhat.rhsa_rule_oval-com.redhat.rhsa-def-20170372",
          "title": "RHSA-2017:0372: kernel-aarch64 security and bug fix update (Important)"
        }
      }
    },
    "rule": {
      "firedtimes": 3,
      "mail": false,
      "level": 9,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: RHSA-2017:0372: kernel-aarch64 security and bug fix update (Important) (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81531",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "RHEL-07-030700 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-2(7)(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), iAU-3(1) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 126 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 130 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 135 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2884 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.2.2 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), Req-10.2.5.b (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), SRG-OS-000037-GPOS-00015 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000042-GPOS-00020 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000392-GPOS-00172 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000462-GPOS-00206 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000471-GPOS-00215 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27461-3 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_sysadmin_actions:def:1"
          },
          "description": "At a minimum, the audit system should collect administrator actions for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d: -w /etc/sudoers -p wa -k actions -w /etc/sudoers.d/ -p wa -k actions If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file: -w /etc/sudoers -p wa -k actions -w /etc/sudoers.d/ -p wa -k actions",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_sysadmin_actions",
          "title": "Ensure auditd Collects System Administrator Actions",
          "rationale": "The actions taken by system administrators should be audited to keep a record of what was executed on the system, as well as, for accountability purposes."
        }
      }
    },
    "rule": {
      "firedtimes": 41,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Ensure auditd Collects System Administrator Actions (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), Req-10.2.7 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.17 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27129-6 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_kernel_module_loading:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following lines to a file with suffix .rules in the directory /etc/audit/rules.d to capture kernel module loading and unloading events, setting ARCH to either b32 or b64 as appropriate for your system: -w /usr/sbin/insmod -p x -k modules -w /usr/sbin/rmmod -p x -k modules -w /usr/sbin/modprobe -p x -k modules -a always,exit -F arch=ARCH -S init_module -S delete_module -k modules If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following lines to /etc/audit/audit.rules file in order to capture kernel module loading and unloading events, setting ARCH to either b32 or b64 as appropriate for your system: -w /usr/sbin/insmod -p x -k modules -w /usr/sbin/rmmod -p x -k modules -w /usr/sbin/modprobe -p x -k modules -a always,exit -F arch=ARCH -S init_module -S delete_module -k modules",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_kernel_module_loading",
          "title": "Ensure auditd Collects Information on Kernel Module Loading and Unloading",
          "rationale": "The addition/removal of kernel modules can be used to alter the behavior of the kernel and potentially introduce malicious code into kernel space. It is important to have an audit trail of modules that have been introduced into the kernel."
        }
      }
    },
    "rule": {
      "firedtimes": 34,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Ensure auditd Collects Information on Kernel Module Loading and Unloading (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), Req-10.2.7 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.17 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27129-6 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_kernel_module_loading:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following lines to a file with suffix .rules in the directory /etc/audit/rules.d to capture kernel module loading and unloading events, setting ARCH to either b32 or b64 as appropriate for your system: -w /usr/sbin/insmod -p x -k modules -w /usr/sbin/rmmod -p x -k modules -w /usr/sbin/modprobe -p x -k modules -a always,exit -F arch=ARCH -S init_module -S delete_module -k modules If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following lines to /etc/audit/audit.rules file in order to capture kernel module loading and unloading events, setting ARCH to either b32 or b64 as appropriate for your system: -w /usr/sbin/insmod -p x -k modules -w /usr/sbin/rmmod -p x -k modules -w /usr/sbin/modprobe -p x -k modules -a always,exit -F arch=ARCH -S init_module -S delete_module -k modules",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_kernel_module_loading",
          "title": "Ensure auditd Collects Information on Kernel Module Loading and Unloading",
          "rationale": "The addition/removal of kernel modules can be used to alter the behavior of the kernel and potentially introduce malicious code into kernel space. It is important to have an audit trail of modules that have been introduced into the kernel."
        }
      }
    },
    "rule": {
      "firedtimes": 34,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Ensure auditd Collects Information on Kernel Module Loading and Unloading (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), Req-10.2.7 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.14 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 366 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2884 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27206-2 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_file_deletion_events:def:1"
          },
          "description": "At a minimum the audit system should collect file deletion events for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S rmdiri,unlink,unlinkat,rename,renameat -F auid>=1000 -F auid!=4294967295 -F key=delete If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S rmdir,unlink,unlinkat,rename -S renameat -F auid>=1000 -F auid!=4294967295 -F key=delete",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_file_deletion_events",
          "title": "Ensure auditd Collects File Deletion Events by User",
          "rationale": "Auditing file deletions will create an audit trail for files that are removed from the system. The audit trail could aid in system troubleshooting, as well as, detecting malicious processes that attempt to delete log files to conceal their presence."
        }
      }
    },
    "rule": {
      "firedtimes": 33,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Ensure auditd Collects File Deletion Events by User (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-030740 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-3(1) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 135 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2884 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000042-GPOS-00020 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000392-GPOS-00172 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), Req-10.2.7 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.13 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27447-2 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_media_export:def:1"
          },
          "description": "At a minimum, the audit system should collect media exportation events for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S mount -F auid>=1000 -F auid!=4294967295 -F key=export If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S mount -F auid>=1000 -F auid!=4294967295 -F key=export",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_media_export",
          "title": "Ensure auditd Collects Information on Exporting to Media (successful)",
          "rationale": "The unauthorized exportation of data to external media could result in an information leak where classified information, Privacy Act information, and intellectual property could be lost. An audit trail should be created each time a filesystem is mounted to help identify and guard against information loss."
        }
      }
    },
    "rule": {
      "firedtimes": 32,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Ensure auditd Collects Information on Exporting to Media (successful) (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-030360 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(4) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-6(9) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 2234 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000327-GPOS-00127 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), Req-10.2.2 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.10 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27437-3 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_privileged_commands:def:1"
          },
          "description": "At a minimum, the audit system should collect the execution of privileged commands for all users and root. To find the relevant setuid / setgid programs, run the following command for each local partition PART: $ sudo find PART -xdev -type f -perm -4000 -o -type f -perm -2000 2>/dev/null If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add a line of the following form to a file with suffix .rules in the directory /etc/audit/rules.d for each setuid / setgid program on the system, replacing the SETUID_PROG_PATH part with the full path of that setuid / setgid program in the list: -a always,exit -F path=SETUID_PROG_PATH -F perm=x -F auid>=1000 -F auid!=4294967295 -F key=privileged If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add a line of the following form to /etc/audit/audit.rules for each setuid / setgid program on the system, replacing the SETUID_PROG_PATH part with the full path of that setuid / setgid program in the list: -a always,exit -F path=SETUID_PROG_PATH -F perm=x -F auid>=1000 -F auid!=4294967295 -F key=privileged",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_privileged_commands",
          "title": "Ensure auditd Collects Information on the Use of Privileged Commands",
          "rationale": "Misuse of privileged functions, either intentionally or unintentionally by authorized users, or by unauthorized external entities that have compromised system accounts, is a serious and ongoing concern and can have significant adverse impacts on organizations. Auditing the use of privileged functions is one way to detect such misuse and identify the risk from insider and advanced persistent threast. Privileged programs are subject to escalation-of-privilege attacks, which attempt to subvert their normal role of providing some necessary but limited capability. As such, motivation exists to monitor these programs for unusual activity."
        }
      }
    },
    "rule": {
      "firedtimes": 31,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Ensure auditd Collects Information on the Use of Privileged Commands (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2884 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.2.4 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), Req-10.2.1 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.10 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27347-4 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_unsuccessful_file_modification:def:1"
          },
          "description": "At a minimum the audit system should collect unauthorized file accesses for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following lines to a file with suffix .rules in the directory /etc/audit/rules.d: -a always,exit -F arch=b32 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EACCES -F auid>=1000 -F auid!=4294967295 -F key=access -a always,exit -F arch=b32 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EPERM -F auid>=1000 -F auid!=4294967295 -F key=access If the system is 64 bit then also add the following lines: -a always,exit -F arch=b64 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EACCES -F auid>=1000 -F auid!=4294967295 -F key=access -a always,exit -F arch=b64 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EPERM -F auid>=1000 -F auid!=4294967295 -F key=access If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following lines to /etc/audit/audit.rules file: -a always,exit -F arch=b32 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EACCES -F auid>=1000 -F auid!=4294967295 -F key=access -a always,exit -F arch=b32 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EPERM -F auid>=1000 -F auid!=4294967295 -F key=access If the system is 64 bit then also add the following lines: -a always,exit -F arch=b64 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EACCES -F auid>=1000 -F auid!=4294967295 -F key=access -a always,exit -F arch=b64 -S creat,open,openat,open_by_handle_at,truncate,ftruncate -F exit=-EPERM -F auid>=1000 -F auid!=4294967295 -F key=access",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_unsuccessful_file_modification",
          "title": "Ensure auditd Collects Unauthorized Access Attempts to Files (unsuccessful)",
          "rationale": "Unsuccessful attempts to access files could be an indicator of malicious activity on a system. Auditing these events could serve as evidence of potential system compromise."
        }
      }
    },
    "rule": {
      "firedtimes": 30,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Ensure auditd Collects Unauthorized Access Attempts to Files (unsuccessful) (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "RHEL-07-030370 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 126 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.5.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.10 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), SRG-OS-000064-GPOS-00033 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000392-GPOS-00172 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000458-GPOS-00203 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000474-GPOS-00219 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27364-9 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_dac_modification_chown:def:1"
          },
          "description": "At a minimum, the audit system should collect file permission changes for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d: -a always,exit -F arch=b32 -S chown -F auid>=1000 -F auid!=4294967295 -F key=perm_mod If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S chown -F auid>=1000 -F auid!=4294967295 -F key=perm_mod If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file: -a always,exit -F arch=b32 -S chown -F auid>=1000 -F auid!=4294967295 -F key=perm_mod If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S chown -F auid>=1000 -F auid!=4294967295 -F key=perm_mod",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_dac_modification_chown",
          "title": "Record Events that Modify the System's Discretionary Access Controls - chown",
          "rationale": "The changing of file permissions could indicate that a user is attempting to gain access to information that would otherwise be disallowed. Auditing DAC modifications can facilitate the identification of patterns of abuse among both authorized and unauthorized users."
        }
      }
    },
    "rule": {
      "firedtimes": 32,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Events that Modify the System's Discretionary Access Controls - chown (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-030470 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.5.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.10 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), SRG-OS-000064-GPOS-00033 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000392-GPOS-00172 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000458-GPOS-00203 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27367-2 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_dac_modification_removexattr:def:1"
          },
          "description": "At a minimum, the audit system should collect file permission changes for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d: -a always,exit -F arch=b32 -S removexattr -F auid>=1000 -F auid!=4294967295 -F key=perm_mod If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S removexattr -F auid>=1000 -F auid!=4294967295 -F key=perm_mod If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file: -a always,exit -F arch=b32 -S removexattr -F auid>=1000 -F auid!=4294967295 -F key=perm_mod If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S removexattr -F auid>=1000 -F auid!=4294967295 -F key=perm_mod",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_dac_modification_removexattr",
          "title": "Record Events that Modify the System's Discretionary Access Controls - removexattr",
          "rationale": "The changing of file permissions could indicate that a user is attempting to gain access to information that would otherwise be disallowed. Auditing DAC modifications can facilitate the identification of patterns of abuse among both authorized and unauthorized users."
        }
      }
    },
    "rule": {
      "firedtimes": 29,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Events that Modify the System's Discretionary Access Controls - removexattr (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), Req-10.5.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 5.2.6 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27076-9 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_networkconfig_modification:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following lines to a file with suffix .rules in the directory /etc/audit/rules.d, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S sethostname,setdomainname -F key=audit_rules_networkconfig_modification -w /etc/issue -p wa -k audit_rules_networkconfig_modification -w /etc/issue.net -p wa -k audit_rules_networkconfig_modification -w /etc/hosts -p wa -k audit_rules_networkconfig_modification -w /etc/sysconfig/network -p wa -k audit_rules_networkconfig_modification If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following lines to /etc/audit/audit.rules file, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S sethostname,setdomainname -F key=audit_rules_networkconfig_modification -w /etc/issue -p wa -k audit_rules_networkconfig_modification -w /etc/issue.net -p wa -k audit_rules_networkconfig_modification -w /etc/hosts -p wa -k audit_rules_networkconfig_modification -w /etc/sysconfig/network -p wa -k audit_rules_networkconfig_modification",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_networkconfig_modification",
          "title": "Record Events that Modify the System's Network Environment",
          "rationale": "The network environment should not be modified by anything other than administrator action. Any change to network parameters should be audited."
        }
      }
    },
    "rule": {
      "firedtimes": 29,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Events that Modify the System's Network Environment (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "RHEL-07-030710 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-2(4) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 18 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 1403 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2130 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.2.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.5 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), SRG-OS-000004-GPOS-00004 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000239-GPOS-00089 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000241-GPOS-00090 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000241-GPOS-00091 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000303-GPOS-00120 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000476-GPOS-00221 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27192-4 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_usergroup_modification:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following lines to a file with suffix .rules in the directory /etc/audit/rules.d, in order to capture events that modify account changes: -w /etc/group -p wa -k audit_rules_usergroup_modification -w /etc/passwd -p wa -k audit_rules_usergroup_modification -w /etc/gshadow -p wa -k audit_rules_usergroup_modification -w /etc/shadow -p wa -k audit_rules_usergroup_modification -w /etc/security/opasswd -p wa -k audit_rules_usergroup_modification If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following lines to /etc/audit/audit.rules file, in order to capture events that modify account changes: -w /etc/group -p wa -k audit_rules_usergroup_modification -w /etc/passwd -p wa -k audit_rules_usergroup_modification -w /etc/gshadow -p wa -k audit_rules_usergroup_modification -w /etc/shadow -p wa -k audit_rules_usergroup_modification -w /etc/security/opasswd -p wa -k audit_rules_usergroup_modification",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_usergroup_modification",
          "title": "Record Events that Modify User/Group Information",
          "rationale": "In addition to auditing new user and group accounts, these watches will alert the system administrator(s) to any modifications. Any unexpected users, groups, or modifications should be investigated for legitimacy."
        }
      }
    },
    "rule": {
      "firedtimes": 28,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Events that Modify User/Group Information (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 5.2.4 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), Req-10.4.2.b (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 1487 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 169 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27310-2 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_time_watch_localtime:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d: -w /etc/localtime -p wa -k audit_time_rules If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file: -w /etc/localtime -p wa -k audit_time_rules The -k option allows for the specification of a key in string form that can be used for better reporting capability through ausearch and aureport and should always be used.",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_time_watch_localtime",
          "title": "Record Attempts to Alter the localtime File",
          "rationale": "Arbitrary changes to the system time can be used to obfuscate nefarious activities in log files, as well as to confuse network services that are highly dependent upon an accurate system time (such as sshd). All changes to the system time should be audited."
        }
      }
    },
    "rule": {
      "firedtimes": 27,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Attempts to Alter the localtime File (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 5.2.4 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), Req-10.4.2.b (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 1487 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 169 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27219-5 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_time_clock_settime:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d: -a always,exit -F arch=b32 -S clock_settime -F a0=0x0 -F key=time-change If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S clock_settime -F a0=0x0 -F key=time-change If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file: -a always,exit -F arch=b32 -S clock_settime -F a0=0x0 -F key=time-change If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S clock_settime -F a0=0x0 -F key=time-change The -k option allows for the specification of a key in string form that can be used for better reporting capability through ausearch and aureport. Multiple system calls can be defined on the same line to save space if desired, but is not required. See an example of multiple combined syscalls: -a always,exit -F arch=b64 -S adjtimex,settimeofday -F key=audit_time_rules",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_time_clock_settime",
          "title": "Record Attempts to Alter Time Through clock_settime",
          "rationale": "Arbitrary changes to the system time can be used to obfuscate nefarious activities in log files, as well as to confuse network services that are highly dependent upon an accurate system time (such as sshd). All changes to the system time should be audited."
        }
      }
    },
    "rule": {
      "firedtimes": 26,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Attempts to Alter Time Through clock_settime (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_common",
            "title": "Common Profile for General-Purpose Systems"
          },
          "id": "0001587603934",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 5.2.4 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), Req-10.4.2.b (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 1487 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 169 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27216-1 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_time_settimeofday:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d: -a always,exit -F arch=b32 -S settimeofday -F key=audit_time_rules If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S settimeofday -F key=audit_time_rules If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file: -a always,exit -F arch=b32 -S settimeofday -F key=audit_time_rules If the system is 64 bit then also add the following line: -a always,exit -F arch=b64 -S settimeofday -F key=audit_time_rules The -k option allows for the specification of a key in string form that can be used for better reporting capability through ausearch and aureport. Multiple system calls can be defined on the same line to save space if desired, but is not required. See an example of multiple combined syscalls: -a always,exit -F arch=b64 -S adjtimex,settimeofday -F key=audit_time_rules",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_time_settimeofday",
          "title": "Record attempts to alter time through settimeofday",
          "rationale": "Arbitrary changes to the system time can be used to obfuscate nefarious activities in log files, as well as to confuse network services that are highly dependent upon an accurate system time (such as sshd). All changes to the system time should be audited."
        }
      }
    },
    "rule": {
      "firedtimes": 25,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record attempts to alter time through settimeofday (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), Req-10.2.7 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.14 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 366 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2884 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27206-2 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_file_deletion_events:def:1"
          },
          "description": "At a minimum the audit system should collect file deletion events for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following line to a file with suffix .rules in the directory /etc/audit/rules.d, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S rmdiri,unlink,unlinkat,rename,renameat -F auid>=1000 -F auid!=4294967295 -F key=delete If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following line to /etc/audit/audit.rules file, setting ARCH to either b32 or b64 as appropriate for your system: -a always,exit -F arch=ARCH -S rmdir,unlink,unlinkat,rename -S renameat -F auid>=1000 -F auid!=4294967295 -F key=delete",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_file_deletion_events",
          "title": "Ensure auditd Collects File Deletion Events by User",
          "rationale": "Auditing file deletions will create an audit trail for files that are removed from the system. The audit trail could aid in system troubleshooting, as well as, detecting malicious processes that attempt to delete log files to conceal their presence."
        }
      }
    },
    "rule": {
      "firedtimes": 24,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Ensure auditd Collects File Deletion Events by User (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2884 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.2.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.8 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27204-7 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_login_events:def:1"
          },
          "description": "The audit system already collects login information for all users and root. If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following lines to a file with suffix .rules in the directory /etc/audit/rules.d in order to watch for attempted manual edits of files involved in storing logon events: -w /var/log/tallylog -p wa -k logins -w /var/run/faillock/ -p wa -k logins -w /var/log/lastlog -p wa -k logins If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following lines to /etc/audit/audit.rules file in order to watch for unattempted manual edits of files involved in storing logon events: -w /var/log/tallylog -p wa -k logins -w /var/run/faillock/ -p wa -k logins -w /var/log/lastlog -p wa -k logins",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_login_events",
          "title": "Record Attempts to Alter Logon and Logout Events",
          "rationale": "Manual editing of these files may indicate nefarious activity, such as an attacker attempting to remove evidence of an intrusion."
        }
      }
    },
    "rule": {
      "firedtimes": 20,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Attempts to Alter Logon and Logout Events (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "low",
          "references": "RHEL-07-030710 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-2(4) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AC-17(7) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-2(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-12(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 18 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 172 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 1403 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 2130 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.2.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.2.5 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), SRG-OS-000004-GPOS-00004 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000239-GPOS-00089 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000241-GPOS-00090 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000241-GPOS-00091 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000303-GPOS-00120 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000476-GPOS-00221 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27192-4 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-audit_rules_usergroup_modification:def:1"
          },
          "description": "If the auditd daemon is configured to use the augenrules program to read audit rules during daemon startup (the default), add the following lines to a file with suffix .rules in the directory /etc/audit/rules.d, in order to capture events that modify account changes: -w /etc/group -p wa -k audit_rules_usergroup_modification -w /etc/passwd -p wa -k audit_rules_usergroup_modification -w /etc/gshadow -p wa -k audit_rules_usergroup_modification -w /etc/shadow -p wa -k audit_rules_usergroup_modification -w /etc/security/opasswd -p wa -k audit_rules_usergroup_modification If the auditd daemon is configured to use the auditctl utility to read audit rules during daemon startup, add the following lines to /etc/audit/audit.rules file, in order to capture events that modify account changes: -w /etc/group -p wa -k audit_rules_usergroup_modification -w /etc/passwd -p wa -k audit_rules_usergroup_modification -w /etc/gshadow -p wa -k audit_rules_usergroup_modification -w /etc/shadow -p wa -k audit_rules_usergroup_modification -w /etc/security/opasswd -p wa -k audit_rules_usergroup_modification",
          "id": "xccdf_org.ssgproject.content_rule_audit_rules_usergroup_modification",
          "title": "Record Events that Modify User/Group Information",
          "rationale": "In addition to auditing new user and group accounts, these watches will alert the system administrator(s) to any modifications. Any unexpected users, groups, or modifications should be investigated for legitimacy."
        }
      }
    },
    "rule": {
      "firedtimes": 6,
      "mail": false,
      "level": 5,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Record Events that Modify User/Group Information (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81529",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "AU-1(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-3(2) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IR-5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 136 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-10.5.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.4.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.3.1 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27341-7 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-auditd_audispd_syslog_plugin_activated:def:1"
          },
          "description": "To configure the auditd service to use the syslog plug-in of the audispd audit event multiplexor, set the active line in /etc/audisp/plugins.d/syslog.conf to yes. Restart the auditd service: $ sudo service auditd restart",
          "id": "xccdf_org.ssgproject.content_rule_auditd_audispd_syslog_plugin_activated",
          "title": "Configure auditd to use audispd's syslog plugin",
          "rationale": "The auditd service does not include the ability to send audit records to a centralized server for management directly. It does, however, include a plug-in for audit event multiplexor (audispd) to pass audit records to the local syslog server"
        }
      }
    },
    "rule": {
      "firedtimes": 16,
      "mail": false,
      "level": 7,
      "pci_dss": ["2.2"],
      "description": "OpenSCAP: Configure auditd to use audispd's syslog plugin (not passed)",
      "groups": ["oscap","oscap-result"],
      "id": "81530",
      "nist_800_53": ["CM.1"]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010500 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), IA-2(2) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 765 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 766 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 767 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 768 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 771 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 772 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 884 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-8.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), SRG-OS-000104-GPOS-00051 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000106-GPOS-00053 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000107-GPOS-00054 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000109-GPOS-00056 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000108-GPOS-00055 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000108-GPOS-00057 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000108-GPOS-00058 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx)",
          "identifiers": "CCE-80207-4 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-smartcard_auth:def:1"
          },
          "description": "To enable smart card authentication, consult the documentation at: https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/7/html/System-Level_Authentication_Guide/smartcards.html#authconfig-smartcards For guidance on enabling SSH to authenticate against a Common Access Card (CAC), consult documentation at: https://access.redhat.com/solutions/82273",
          "id": "xccdf_org.ssgproject.content_rule_smartcard_auth",
          "title": "Enable Smart Card Login",
          "rationale": "Smart card login provides two-factor authentication stronger than that provided by a username and password combination. Smart cards leverage PKI (public key infrastructure) in order to provide and verify credentials."
        }
      }
    },
    "rule": {
      "firedtimes": 11,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Enable Smart Card Login (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010270 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), IA-5(f) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(1)(e) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 200 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000077-GPOS-00045 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), Req-8.2.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.3.3 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.6.2.1.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.5.8 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-26923-3 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_password_pam_unix_remember:def:1"
          },
          "description": "Do not allow users to reuse recent passwords. This can be accomplished by using the remember option for the pam_unix or pam_pwhistory PAM modules. In the file /etc/pam.d/system-auth, append remember= to the line which refers to the pam_unix.so or pam_pwhistory.somodule, as shown below: for the pam_unix.so case: password sufficient pam_unix.so ...existing_options... remember= for the pam_pwhistory.so case: password requisite pam_pwhistory.so ...existing_options... remember= The DoD STIG requirement is 5 passwords.",
          "id": "xccdf_org.ssgproject.content_rule_accounts_password_pam_unix_remember",
          "title": "Limit Password Reuse",
          "rationale": "Preventing re-use of previous passwords helps ensure that a compromised password is not re-used by a user."
        }
      }
    },
    "rule": {
      "firedtimes": 10,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Limit Password Reuse (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010320 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-7(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 002238 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000329-GPOS-00128 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000021-GPOS-00005 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), Req-8.1.7 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 6.3.3 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.5.3 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.8 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-26884-7 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_passwords_pam_faillock_unlock_time:def:1"
          },
          "description": "To configure the system to lock out accounts after a number of incorrect login attempts and require an administrator to unlock the account using pam_faillock.so, modify the content of both /etc/pam.d/system-auth and /etc/pam.d/password-auth as follows: add the following line immediately before the pam_unix.so statement in the AUTH section: auth required pam_faillock.so preauth silent deny= unlock_time= fail_interval= add the following line immediately after the pam_unix.so statement in the AUTH section: auth [default=die] pam_faillock.so authfail deny= unlock_time= fail_interval= add the following line immediately before the pam_unix.so statement in the ACCOUNT section: account required pam_faillock.so",
          "id": "xccdf_org.ssgproject.content_rule_accounts_passwords_pam_faillock_unlock_time",
          "title": "Set Lockout Time For Failed Password Attempts",
          "rationale": "Locking out user accounts after a number of incorrect attempts prevents direct password guessing attacks. Ensuring that an administrator is involved in unlocking locked accounts draws appropriate attention to such situations."
        }
      }
    },
    "rule": {
      "firedtimes": 9,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Set Lockout Time For Failed Password Attempts (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010320 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-7(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 2238 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000329-GPOS-00128 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000021-GPOS-00005 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), Req-8.1.6 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 6.3.3 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.5.3 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.8 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27350-8 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_passwords_pam_faillock_deny:def:1"
          },
          "description": "To configure the system to lock out accounts after a number of incorrect login attempts using pam_faillock.so, modify the content of both /etc/pam.d/system-auth and /etc/pam.d/password-auth as follows: add the following line immediately before the pam_unix.so statement in the AUTH section: auth required pam_faillock.so preauth silent deny= unlock_time= fail_interval= add the following line immediately after the pam_unix.so statement in the AUTH section: auth [default=die] pam_faillock.so authfail deny= unlock_time= fail_interval= add the following line immediately before the pam_unix.so statement in the ACCOUNT section: account required pam_faillock.so",
          "id": "xccdf_org.ssgproject.content_rule_accounts_passwords_pam_faillock_deny",
          "title": "Set Deny For Failed Password Attempts",
          "rationale": "Locking out user accounts after a number of incorrect attempts prevents direct password guessing attacks."
        }
      }
    },
    "rule": {
      "firedtimes": 8,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Set Deny For Failed Password Attempts (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010130 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), IA-5(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(1)(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 193 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000070-GPOS-00038 (), Req-8.2.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf)",
          "identifiers": "CCE-27345-8 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_password_pam_lcredit:def:1"
          },
          "description": "The pam_pwquality module's lcredit parameter controls requirements for usage of lowercase letters in a password. When set to a negative number, any password will be required to contain that many lowercase characters. When set to a positive number, pam_pwquality will grant +1 additional length credit for each lowercase character. Modify the lcredit setting in /etc/security/pwquality.conf to require the use of a lowercase character in passwords.",
          "id": "xccdf_org.ssgproject.content_rule_accounts_password_pam_lcredit",
          "title": "Set Password Strength Minimum Lowercase Characters",
          "rationale": "Use of a complex password helps to increase the time and resources required to compromise the password. Password complexity, or strength, is a measure of the effectiveness of a password in resisting attempts at guessing and brute-force attacks. Password complexity is one factor of several that determines how long it takes to crack a password. The more complex the password, the greater the number of possble combinations that need to be tested before the password is compromised. Requiring a minimum number of lowercase characters makes password guessing attacks more difficult by ensuring a larger search space."
        }
      }
    },
    "rule": {
      "firedtimes": 7,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Set Password Strength Minimum Lowercase Characters (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010120 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), IA-5(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(1)(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 192 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000069-GPOS-00037 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), Req-8.2.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 6.3.2 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf)",
          "identifiers": "CCE-27200-5 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_password_pam_ucredit:def:1"
          },
          "description": "The pam_pwquality module's ucredit= parameter controls requirements for usage of uppercase letters in a password. When set to a negative number, any password will be required to contain that many uppercase characters. When set to a positive number, pam_pwquality will grant +1 additional length credit for each uppercase character. Modify the ucredit setting in /etc/security/pwquality.conf to require the use of an uppercase character in passwords.",
          "id": "xccdf_org.ssgproject.content_rule_accounts_password_pam_ucredit",
          "title": "Set Password Strength Minimum Uppercase Characters",
          "rationale": "Use of a complex password helps to increase the time and resources reuiqred to compromise the password. Password complexity, or strength, is a measure of the effectiveness of a password in resisting attempts at guessing and brute-force attacks. Password complexity is one factor of several that determines how long it takes to crack a password. The more complex the password, the greater the number of possible combinations that need to be tested before the password is compromised."
        }
      }
    },
    "rule": {
      "firedtimes": 6,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Set Password Strength Minimum Uppercase Characters (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010280 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), IA-5(1)(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 205 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000078-GPOS-00046 (), Req-8.2.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 6.3.2 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf)",
          "identifiers": "CCE-27293-0 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_password_pam_minlen:def:1"
          },
          "description": "The pam_pwquality module's minlen parameter controls requirements for minimum characters required in a password. Add minlen= after pam_pwquality to set minimum password length requirements.",
          "id": "xccdf_org.ssgproject.content_rule_accounts_password_pam_minlen",
          "title": "Set Password Minimum Length",
          "rationale": "The shorter the password, the lower the number of possible combinations that need to be tested before the password is compromised. Password complexity, or strength, is a measure of the effectiveness of a password in resisting attempts at guessing and brute-force attacks. Password length is one factor of several that helps to determine strength and how long it takes to crack a password. Use of more characters in a password helps to exponentially increase the time and/or resources required to compromose the password."
        }
      }
    },
    "rule": {
      "firedtimes": 5,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Set Password Minimum Length (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010140 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), IA-5(1)(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 194 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 194 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000071-GPOS-00039 (), Req-8.2.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 6.3.2 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf)",
          "identifiers": "CCE-27214-6 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_password_pam_dcredit:def:1"
          },
          "description": "The pam_pwquality module's dcredit parameter controls requirements for usage of digits in a password. When set to a negative number, any password will be required to contain that many digits. When set to a positive number, pam_pwquality will grant +1 additional length credit for each digit. Modify the dcredit setting in /etc/security/pwquality.conf to require the use of a digit in passwords.",
          "id": "xccdf_org.ssgproject.content_rule_accounts_password_pam_dcredit",
          "title": "Set Password Strength Minimum Digit Characters",
          "rationale": "Use of a complex password helps to increase the time and resources required to compromise the password. Password complexity, or strength, is a measure of the effectiveness of a password in resisting attempts at guessing and brute-force attacks. Password complexity is one factor of several that determines how long it takes to crack a password. The more complex the password, the greater the number of possble combinations that need to be tested before the password is compromised. Requiring digits makes password guessing attacks more difficult by ensuring a larger search space."
        }
      }
    },
    "rule": {
      "firedtimes": 4,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Set Password Strength Minimum Digit Characters (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-010250 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), IA-5(f) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(g) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(1)(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 199 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000076-GPOS-00044 (), Req-8.2.4 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.4.1.1 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.6.2.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.5.6 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27051-2 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-accounts_maximum_age_login_defs:def:1"
          },
          "description": "To specify password maximum age for new accounts, edit the file /etc/login.defs and add or correct the following line: PASS_MAX_DAYS A value of 180 days is sufficient for many environments. The DoD requirement is 60. The profile requirement is .",
          "id": "xccdf_org.ssgproject.content_rule_accounts_maximum_age_login_defs",
          "title": "Set Password Maximum Age",
          "rationale": "Any password, no matter how complex, can eventually be cracked. Therefore, passwords need to be changed periodically. If the operating system does not limit the lifetime of passwords and force users to change their passwords, there is the risk that the operating system passwords could be compromised. Setting the password maximum age ensures users are required to periodically change their passwords. Requiring shorter password lifetimes increases the risk of users writing down the password in a convenient location subject to physical compromise."
        }
      }
    },
    "rule": {
      "firedtimes": 3,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Set Password Maximum Age (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "high",
          "references": "RHEL-07-010290 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-6 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(b) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(c) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), IA-5(1)(a) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 366 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), SRG-OS-000480-GPOS-00227 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), Req-8.2.3 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 5.5.2 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.1.1 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf), 3.1.5 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27286-4 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-no_empty_passwords:def:1"
          },
          "description": "If an account is configured for password authentication but does not have an assigned password, it may be possible to log into the account without authentication. Remove any instances of the nullok option in /etc/pam.d/system-auth to prevent logins with empty passwords.",
          "id": "xccdf_org.ssgproject.content_rule_no_empty_passwords",
          "title": "Prevent Log In to Accounts With Empty Password",
          "rationale": "If an account has an empty password, anyone could log in and run commands with the privileges of that account. Accounts with empty passwords should never be used in operational environments."
        }
      }
    },
    "rule": {
      "firedtimes": 2,
      "mail": false,
      "level": 9,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Prevent Log In to Accounts With Empty Password (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81531",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "high",
          "references": "RHEL-07-010010 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), AC-6 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-9(1) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), AU-9(3) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-6(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-6(3) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 1494 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), 1496 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-11.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 1.2.6 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.1.3 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.1.4 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.1.5 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.1.6 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.1.7 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.1.8 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.1.9 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 6.2.3 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), SRG-OS-000257-GPOS-00098 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), SRG-OS-000278-GPOS-00108 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), 5.10.4.1 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf), 3.3.8 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf), 3.4.1 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-171.pdf)",
          "identifiers": "CCE-27209-6 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-rpm_verify_permissions:def:1"
          },
          "description": "Discretionary access control is weakened if a user or group has access permissions to system files and directories greater than the default. The RPM package management system can check file access permissions of installed software packages, including many that are important to system security. Verify that the file permissions, ownership, and gruop membership of system files and commands match vendor values. Check the file permissions, ownership, and group membership with the following command: $ sudo rpm -Va | grep '^.M' Output indicates files that do not match vendor defaults. After locating a file with incorrect permissions, run the following command to determine which package owns it: $ rpm -qf FILENAME Next, run the following command to reset its permissions to the correct values: $ sudo rpm --setperms PACKAGENAME",
          "id": "xccdf_org.ssgproject.content_rule_rpm_verify_permissions",
          "title": "Verify and Correct File Permissions with RPM",
          "rationale": "Permissions on system binaries and configuration files that are too generous could allow an unauthorized user to gain privileges that they should not have. The permissions set by the vendor should be maintained. Any deviations from this baseline should be investigated."
        }
      }
    },
    "rule": {
      "firedtimes": 1,
      "mail": false,
      "level": 9,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Verify and Correct File Permissions with RPM (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81531",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "RHEL-07-020030 (http://iase.disa.mil/stigs/os/unix-linux/Pages/index.aspx), CM-3(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-3(e) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-3(5) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-6(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-6(3) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), SC-28 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), SI-7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), 1744 (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-11.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 1.3.2 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), SRG-OS-000363-GPOS-00150 (http://iase.disa.mil/stigs/srgs/Pages/index.aspx), 5.10.1.3 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf)",
          "identifiers": "CCE-26952-2 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-aide_periodic_cron_checking:def:1"
          },
          "description": "At a minimum, AIDE should be configured to run a weekly scan. At most, AIDE should be run daily. To implement a daily execution of AIDE at 4:05am using cron, add the following line to /etc/crontab: 05 4 * * * root /usr/sbin/aide --check To implement a weekly execution of AIDE at 4:05am using cron, add the following line to /etc/crontab: 05 4 * * 0 root /usr/sbin/aide --check AIDE can be executed periodically through other means; this is merely one example.",
          "id": "xccdf_org.ssgproject.content_rule_aide_periodic_cron_checking",
          "title": "Configure Periodic Execution of AIDE",
          "rationale": "By default, AIDE does not install itself for periodic execution. Periodically running AIDE is necessary to reveal unexpected changes in installed files. Unauthorized changes to the baseline configuration could make the system vulnerable to various attacks or allow unauthorized access to the operating system. Changes to operating system configurations can have unintended side effects, some of which may be relevant to security. Detecting such changes and providing an automated response can help avoid unintended, negative consequences that could ultimately affect the security state of the operating system. The operating system's Information Management Officer (IMO)/Information System Security Officer (ISSO) and System Administrators (SAs) must be notified via email and/or monitoring system trap when there is an unauthorized modification of a configuration item."
        }
      }
    },
    "rule": {
      "firedtimes": 2,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Configure Periodic Execution of AIDE (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "profile": {
            "id": "xccdf_org.ssgproject.content_profile_pci-dss",
            "title": "PCI-DSS v3 Control Baseline for Red Hat Enterprise Linux 7"
          },
          "id": "0001587603717",
          "content": "ssg-rhel-7-ds.xml",
          "benchmark": {
            "id": "xccdf_org.ssgproject.content_benchmark_RHEL-7"
          }
        },
        "check": {
          "result": "fail",
          "severity": "medium",
          "references": "CM-3(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-3(e) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-6(d) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), CM-6(3) (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), SC-28 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf), SI-7 (http://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r4.pdf),  (http://iase.disa.mil/stigs/cci/Pages/index.aspx), Req-11.5 (https://www.pcisecuritystandards.org/documents/PCI_DSS_v3-1.pdf), 1.3.1 (https://benchmarks.cisecurity.org/tools2/linux/CIS_Red_Hat_Enterprise_Linux_7_Benchmark_v1.1.0.pdf), 5.10.1.3 (https://www.fbi.gov/file-repository/cjis-security-policy-v5_5_20160601-2-1.pdf)",
          "identifiers": "CCE-27096-7 (https://nvd.nist.gov/cce/index.cfm)",
          "oval": {
            "id": "oval:ssg-package_aide_installed:def:1"
          },
          "description": "Install the AIDE package with the command: $ sudo yum install aide",
          "id": "xccdf_org.ssgproject.content_rule_package_aide_installed",
          "title": "Install AIDE",
          "rationale": "The AIDE package must be installed if it is to be available for integrity checking."
        }
      }
    },
    "rule": {
      "firedtimes": 1,
      "mail": false,
      "level": 7,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP: Install AIDE (not passed)",
      "groups": [
        "oscap",
        "oscap-result"
      ],
      "id": "81530",
      "nist_800_53": [
        "CM.1"
      ]
    }
  },
  {
    "data": {
      "oscap": {
        "scan": {
          "score": "99.814812",
          "profile": {
            "id": "No profile",
            "title": "No profile"
          },
          "id": "0001587574647",
          "content": "cve-redhat-7-ds.xml",
          "benchmark": {
            "id": "xccdf_com.redhat.rhsa_benchmark_generated-xccdf"
          }
        }
      }
    },
    "manager": {
      "name": "ip-10-0-0-219.us-west-1.compute.internal"
    },
    "rule": {
      "firedtimes": 1,
      "mail": false,
      "level": 3,
      "pci_dss": [
        "2.2"
      ],
      "description": "OpenSCAP Report overview.",
      "groups": [
        "oscap",
        "oscap-report"
      ],
      "id": "81540",
      "nist_800_53": [
        "CM.1"
      ]
    }
  }
]
