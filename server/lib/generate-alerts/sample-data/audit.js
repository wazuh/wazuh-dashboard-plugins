/*
 * Wazuh app - Audit sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Audit
export const command = ["sudo", "ssh", "cron", "ls"];
export const exe = ["/usr/sbin/sudo", "/usr/sbin/sshd", "/usr/sbin/crond", "/usr/bin/ls"]; // https://wazuh.com/blog/monitoring-root-actions-on-linux-using-auditd-and-wazuh/
export const fileName = ["/etc/samplefile", "/etc/sample/file", "/var/sample"];
export const ruleDescription = ["Auditd: device enables promiscuous mode", "Auditd: SELinux permission check", "Auditd: End", "Auditd: Configuration changed", "Audit: Command: "];