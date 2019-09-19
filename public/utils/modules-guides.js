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
    name: 'File integrity monitoring',
    description: 'Configuration options for file integrity monitoring.',
    options: [
      {
        name: 'directories',
        description: `Use this option to add or remove directories to be monitored. The directories must be comma separated.
    All files and subdirectories within the noted directories will also be monitored.              
    Drive letters without directories are not valid. At a minimum the ‘.’ should be included (D:\.).
    This is to be set on the system to be monitored (or in the agent.conf, if appropriate).`,
        type: 'input',
        required: true,
        extraAttr: {
          realtime: { default: false, type: 'switch' },
          whodata: { default: false, type: 'switch' },
          report_changes: { default: false, type: 'switch' },
          check_all: { default: true },
          check_sum: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_sha1sum: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_md5sum: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_sha256sum: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_size: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_owner: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_group: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_perm: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_mtime: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_inode: {
            default: false,
            requirement: 'check_all',
            type: 'switch'
          },
          follow_symbolic_link: { default: false, type: 'switch' }
        }
      },
      {
        name: 'ignore',
        description: `List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories are still checked, but the results are ignored.`,
        type: 'list',
        required: true
      },
      {
        name: 'nodiff',
        description: `List of files to not compute the diff (one entry per line). It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.`,
        type: 'list',
        required: true
      },
      {
        name: 'frequency',
        description: `Frequency that the syscheck will be run (in seconds).`,
        type: 'input',
        default_value: 43200
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
        type: 'switch',
        default_value: false
      },
      {
        name: 'alert_new_files',
        description: `Specifies if syscheck should alert when new files are created.`,
        type: 'switch',
        default_value: true
      },
      {
        name: 'scan_on_start',
        description: `Specifies if syscheck scans immediately when started.`,
        type: 'switch',
        default_value: true
      },
      {
        name: 'windows_registry',
        description: `Use this option to monitor specified Windows registry entries (one entry per line). Multiple lines may be entered to include multiple registry entries.`,
        type: 'list',
        required: true
      },
      {
        name: 'registry_ignore',
        description: `List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.`,
        type: 'list'
      },
      {
        name: 'prefilter_cmd',
        description: `Run to prevent prelinking from creating false positives.`,
        type: 'input'
      },
      {
        name: 'skip_nfs',
        description: `Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.`,
        type: 'switch',
        default_value: true
      },
      {
        name: 'remove_old_diff',
        description: `Specifies if Syscheck should delete the local snapshots that are not currently being monitorized.`,
        type: 'switch',
        default_value: true
      },
      {
        name: 'restart_audit',
        description: `Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.`,
        type: 'switch',
        default_value: true
      },
      {
        name: 'windows_audit_interval',
        description: `This option sets the frequency with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.`,
        type: 'input',
        default_value: 300
      }
    ]
  },
  localfile: {
    id: 'localfile',
    name: 'Monitor local files',
    description:
      'This configuration section is used to configure the collection of log data from files, Windows events, and from the output of commands.',
    options: [
      {
        name: 'location',
        description: `This indicates the location of a log or wild-carded group of logs to be read.`,
        type: 'input',
        required: true
      },
      {
        name: 'log_format',
        description: `This specifies the format of the log being read`,
        type: 'select',
        values: [
          'syslog',
          'json',
          'eventchannel',
          'full_command',
          'audit',
          'command',
          'apache',
          'mysql_log',
          'postgresql_log',
          'nmapg',
          'snort-full',
          'snort-fast',
          'squid',
          'iis',
          'eventlog',
          'djb-multilog',
          'multi-line'
        ],
        required: true
      },
      {
        name: 'command',
        description: `This designates a command to be run. All output from this command will be read as one or more log messages depending on whether command or full_command is used.`,
        type: 'input'
      },
      {
        name: 'frequency',
        description: `The frequency specifies the minimum amount of time in seconds between command runs.`,
        type: 'input'
      },
      {
        name: 'query',
        description: `Only to be used with the eventchannel log format. With this option, you can identify an XPATH query following the event schema that will filter the events that Wazuh will process.`,
        type: 'input'
      },
      {
        name: 'target',
        description: `Target specifies the name of the socket where the output will be redirected. The socket must be defined previously to use it with this option.`,
        type: 'input'
      }
    ]
  },
  'docker-listener': {
    isWodle : true,
    id: 'docker-listener',
    name: 'Docker listener wodle',
    description: 'Configuration options of the Docker wodle.',
    options: [
      {
        name: 'interval',
        description: `Waiting time to rerun the wodle in case it fails.`,
        type: 'input',
        required: true
      },
      {
        name: 'attempts',
        description: `Number of attempts to execute the wodle.`,
        type: 'input',
        required: true
      },
      {
        name: 'run_on_start',
        description: `Run command immediately when service is started.`,
        type: 'switch',
        required: true
      },
      {
        name: 'disabled',
        description: `Disable the Docker wodle.`,
        type: 'switch',
        required: true
      }
    ]
  },
  osquery: {
    isWodle : true,
    id: 'osquery',
    name: 'Osquery wodle',
    description: 'Configuration options of the osquery wodle.',
    options: [
      {
        name: 'disabled',
        description: `Disable the osquery wodle.`,
        type: 'switch',
        required: true,
        default_value: false
      },
      {
        name: 'run_daemon',
        description: `Makes the module run osqueryd as a subprocess or lets the module monitor the results log without running Osquery.`,
        type: 'switch',
        required: true,
        default_value: true
      },
      {
        name: 'bin_path',
        description: `Full path to the folder that contains the osqueryd executable.`,
        type: 'input',
        required: true
      },
      {
        name: 'log_path',
        description: `Full path to the results log written by Osquery.`,
        type: 'input',
        required: true
      },      
      {
        name: 'config_path',
        description: `Path to the Osquery configuration file. This path can be relative to the folder where the Wazuh agent is running.`,
        type: 'input',
        required: true
      },
      {
        name: 'add_labels',
        description: `Add the agent labels defined as decorators.`,
        type: 'switch',
        required: true,
        default_value: true
      },
      {
        name: 'pack',
        description: `Add a query pack to the configuration. This option can be defined multiple times.`,
        type: 'input',
        required: true,
        extraAttr: {
          name: { value: "custom_pack", type: 'input' }
        }
      }
    ]
  }
};
