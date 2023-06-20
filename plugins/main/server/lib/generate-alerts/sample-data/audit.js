/*
 * Wazuh app - Audit sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Audit

import { randomArrayItem } from './common';

export const fileName = ["/etc/samplefile", "/etc/sample/file", "/var/sample"];
const ruleId = ['80790', '80784', '80781', '80791'];
const auditType = ["SYSCALL", "EXECVE", "CWD", "NORMAL", "PATH", "PROCTITLE"];

export const dataAudit = [{
    data: {
      audit: {
        file: {
          name: ''
        },
        exe: '/usr/sbin/sudo',
        command: 'sudo',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 12,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/sudo",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: ''
        },
        exe: '/usr/sbin/sshd',
        command: 'ssh',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 3,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/ssh",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: ''
        },
        exe: '/usr/sbin/crond',
        command: 'cron',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 1,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/crond",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: ''
        },
        exe: '/usr/sbin/ls',
        command: 'ls',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 6,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/ls",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: '/sbin/consoletype'
        },
        exe: '/usr/sbin/consoletype',
        command: 'consoletype',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 16,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/consoletype",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: '/bin/bash'
        },
        exe: '/usr/sbin/bash',
        command: 'bash',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 1,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/bash",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: '/usr/bin/id'
        },
        exe: '/usr/sbin/id',
        command: 'id',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 11,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/id",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: '/usr/bin/grep'
        },
        exe: '/usr/sbin/grep',
        command: 'grep',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 13,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/grep",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: '/usr/bin/hostname'
        },
        exe: '/usr/sbin/hostname',
        command: 'hostname',
        success: 'yes',
        cwd: "/home/wazuh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 13,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/hostname",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  {
    data: {
      audit: {
        file: {
          name: '/usr/bin/sh'
        },
        exe: '/usr/sbin/sh',
        command: 'sh',
        success: 'yes',
        cwd: "/home/sh",
        type: randomArrayItem(auditType),
      },
    },
    rule: {
      id: randomArrayItem(ruleId),
      firedtimes: 17,
      mail: false,
      level: 3,
      description: "Audit: Command: /usr/sbin/sh",
      groups: [
        "audit",
        "audit_command"
      ],
      gdpr: [
        "IV_30.1.g"
      ]
    },
  },
  //   {
  //     data: {
  //       audit: {
  //         res: "1",
  //         id: "1002556",
  //         type: "CONFIG_CHANGE",
  //         list: "4",
  //         key: "wazuh_fim"
  //       },
  //     },
  //     rule: {
  // id: randomArrayItem(ruleId),
  //       firedtimes: 10,
  //       mail: false,
  //       level: 3,
  //       description: "Auditd: Configuration changed",
  //       groups: [
  //         "audit",
  //         "audit_configuration"
  //       ],
  //       gpg13: [
  //         "10.1"
  //       ],
  //       gdpr: [
  //         "IV_30.1.g"
  //       ]
  //     },
  //   },
]
