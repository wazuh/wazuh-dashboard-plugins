/*
 * Wazuh app - OpenSCAP sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
