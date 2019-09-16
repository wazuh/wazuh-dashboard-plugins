/*
 * Wazuh app - Modules information to configure them
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const ModulesGuides = {
  syscheck: {
    id: 'syscheck',
    name: 'Syscheck',
    description: 'Configuration options for file integrity monitoring.',
    default_configuration: [
      {
        title: 'Default Unix configuration',
        content: '<test> syscheck </test>'
      }
    ],
    options: [
      {
        name: 'directories',
        description: `Use this option to add or remove directories to be monitored. The directories must be comma separated.
    All files and subdirectories within the noted directories will also be monitored.              
    Drive letters without directories are not valid. At a minimum the '.' should be included (D:\.).
    This is to be set on the system to be monitored (or in the agent.conf, if appropriate).`,
        type: 'list'
      },
      {
        name: 'ignore',
        description: `List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories are still checked, but the results are ignored.`,
        type: 'switch'
      },
      {
        name: 'nodiff',
        description: `List of files to not compute the diff (one entry per line). It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.`,
        type: 'list'
      },
      {
        name: 'frequency',
        description: `Frequency that the syscheck will be run (in seconds).`,
        type: 'input'
      },
      {
        name: 'scan_time',
        description: `Time to run the scans. Times may be represented as 9pm or 8:30.`,
        type: 'input'
      },
      {
        name: 'scan_day',
        description: `Day of the week to run the scans(one entry per line). Multiple lines may be entered to include multiple registry entries.`,
        type: 'input'
      },
      {
        name: 'auto_ignore',
        description: `Specifies whether or not syscheck will ignore files that change too many times (manager only).`,
        type: 'switch'
      },
      {
        name: 'alert_new_files',
        description: `Specifies if syscheck should alert when new files are created.`,
        type: 'switch'
      },
      {
        name: 'scan_on_start',
        description: `Specifies if syscheck scans immediately when started.`,
        type: 'switch'
      },
      {
        name: 'windows_registry',
        description: `Use this option to monitor specified Windows registry entries (one entry per line). Multiple lines may be entered to include multiple registry entries.`,
        type: 'list'
      },
      {
        name: 'registry_ignore',
        description: `List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.`,
        type: 'list'
      },
      {
        name: 'prefilter_cmd',
        description: `Run to prevent prelinking from creating false positives.`,
        type: 'switch'
      },
      {
        name: 'skip_nfs',
        description: `Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.`,
        type: 'switch'
      },
      {
        name: 'remove_old_diff',
        description: `Specifies if Syscheck should delete the local snapshots that are not currently being monitorized.`,
        type: 'switch'
      },
      {
        name: 'restart_audit',
        description: `Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won't be applied automatically.`,
        type: 'switch'
      },
      {
        name: 'windows_audit_interval',
        description: `This option sets the frequency with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.`,
        type: 'input'
      },
      {
        name: 'whodata',
        description: `The Whodata options will be configured inside this tag.`,
        type: 'list'
      }
    ]
  }
};
