/*
 * Wazuh app - Osquery sample alerts
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

 // Osquery
export const name = ["pack_vuln-management_rpm_packages", "pack_osquery-monitoring_schedule", "pack_osquery-monitoring_osquery_info", "pack_it-compliance_rpm_packages", "pack_it-compliance_mounts", "pack_incident-response_process_env", "pack_incident-response_open_files", "pack_incident-response_listening_ports", "pack_incident-response_last"];
export const ruleDescription = ["osquery error message", "osquery: osquery-monitoring schedule: The pack executed is high_load_average and the interval is 900", "osquery: incident-response process_memory: Process 1194 /run/log/journal/ff05fd7dc5b84794a0a2d9f30c5284e6/system.journal memory start 0x7fbfd2cd9000, memory end 0x7fbfd34d9000", "osquery: incident-response mounts: Mount point at cgroup with 0 free blocks"];
export const action = ["added", "removed"];
export const pack = ["/etc/osquery-packs/custom_pack.conf", "/etc/osquery-packs/custom_pack2.conf", "/etc/osquery-packs/custom_pack3.conf", "/etc/osquery-packs/custom_pack4.conf", "/etc/osquery-packs/custom_pack5.conf", "/etc/osquery-packs/custom_pack6.conf"];