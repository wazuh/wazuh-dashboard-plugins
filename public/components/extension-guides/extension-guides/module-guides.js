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
    type: 2,
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
          realtime: { default_value: false, type: 'switch' },
          whodata: { default_value: false, type: 'switch' },
          report_changes: { default_value: false, type: 'switch' },
          check_all: { default_value: true, type: 'switch' },
          check_sum: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_sha1sum: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_md5sum: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_sha256sum: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_size: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_owner: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_group: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_perm: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_mtime: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          check_inode: {
            default_value: false,
            requirement: 'check_all',
            type: 'switch'
          },
          follow_symbolic_link: { default_value: false, type: 'switch' },
          restrict: { type: 'input' },
          tags: { type: 'input' },
          recursion_level: { type: 'input' }
        }
      },
      {
        name: 'ignore',
        description:
          'List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories are still checked, but the results are ignored.',
        type: 'list',
        required: true
      },
      {
        name: 'nodiff',
        description:
          'List of files to not compute the diff (one entry per line). It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.',
        type: 'list',
        required: true
      },
      {
        name: 'frequency',
        description: 'Frequency that the syscheck will be run (in seconds).',
        type: 'input',
        default_value: 43200
      },
      {
        name: 'scan_time',
        description:
          'Time to run the scans. Times may be represented as 9pm or 8:30.',
        type: 'input'
      },
      {
        name: 'scan_day',
        description:
          'Day of the week to run the scans(one entry per line). Multiple lines may be entered to include multiple registry entries.',
        type: 'input'
      },
      {
        name: 'auto_ignore',
        description:
          'Specifies whether or not syscheck will ignore files that change too many times (manager only).',
        type: 'switch',
        default_value: false
      },
      {
        name: 'alert_new_files',
        description:
          'Specifies if syscheck should alert when new files are created.',
        type: 'switch',
        default_value: true
      },
      {
        name: 'scan_on_start',
        description: 'Specifies if syscheck scans immediately when started.',
        type: 'switch',
        default_value: true
      },
      {
        name: 'windows_registry',
        description:
          'Use this option to monitor specified Windows registry entries (one entry per line). Multiple lines may be entered to include multiple registry entries.',
        type: 'list',
        required: true
      },
      {
        name: 'registry_ignore',
        description:
          'List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.',
        type: 'list'
      },
      {
        name: 'prefilter_cmd',
        description: 'Run to prevent prelinking from creating false positives.',
        type: 'input'
      },
      {
        name: 'skip_nfs',
        description:
          'Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.',
        type: 'switch',
        default_value: true
      },
      {
        name: 'remove_old_diff',
        description:
          'Specifies if Syscheck should delete the local snapshots that are not currently being monitorized.',
        type: 'switch',
        default_value: true
      },
      {
        name: 'restart_audit',
        description:
          'Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.',
        type: 'switch',
        default_value: true
      },
      {
        name: 'windows_audit_interval',
        description:
          'This option sets the frequency with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.',
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
    type: 2,
    options: [
      {
        name: 'location',
        description:
          'This indicates the location of a log or wild-carded group of logs to be read.',
        type: 'input',
      },
      {
        name: 'log_format',
        description: 'This specifies the format of the log being read',
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
        description:
          'This designates a command to be run. All output from this command will be read as one or more log messages depending on whether command or full_command is used.',
        type: 'input'
      },
      {
        name: 'frequency',
        description:
          'The frequency specifies the minimum amount of time in seconds between command runs.',
        type: 'input'
      },
      {
        name: 'query',
        description:
          'Only to be used with the eventchannel log format. With this option, you can identify an XPATH query following the event schema that will filter the events that Wazuh will process.',
        type: 'input'
      },
      {
        name: 'target',
        description:
          'Target specifies the name of the socket where the output will be redirected. The socket must be defined previously to use it with this option.',
        type: 'input'
      }
    ]
  },
  'docker-listener': {
    isWodle: true,
    id: 'docker-listener',
    name: 'Docker listener wodle',
    docsLink:
      'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/wodle-docker.html',
    description: 'Configuration options of the Docker wodle.',
    type: 2,
    options: [
      {
        name: 'interval',
        description: 'Waiting time to rerun the wodle in case it fails.',
        type: 'input',
        default_value: '1m',
        required: true
      },
      {
        name: 'attempts',
        description: 'Number of attempts to execute the wodle.',
        type: 'input',
        default_value: '5',
        required: true
      },
      {
        name: 'run_on_start',
        description: 'Run command immediately when service is started.',
        type: 'switch',
        default_value: true,
        required: true
      },
      {
        name: 'disabled',
        description: 'Disable the Docker wodle.',
        type: 'switch',
        default_value: false,
        required: true
      }
    ]
  },
  osquery: {
    isWodle: true,
    id: 'osquery',
    name: 'Osquery wodle',
    extraSteps: `Osquery is not installed by default. It is a open source software that you have to obtain for using this module.`,
    description: 'Configuration options of the osquery wodle.',
    type: 2,
    options: [
      {
        name: 'disabled',
        description: 'Disable the osquery wodle.',
        type: 'switch',
        required: true,
        default_value: false
      },
      {
        name: 'run_daemon',
        description:
          'Makes the module run osqueryd as a subprocess or lets the module monitor the results log without running Osquery.',
        type: 'switch',
        required: true,
        default_value: true
      },
      {
        name: 'bin_path',
        description:
          'Full path to the folder that contains the osqueryd executable.',
        type: 'input',
        required: true
      },
      {
        name: 'log_path',
        description: 'Full path to the results log written by Osquery.',
        type: 'input',
        required: true
      },
      {
        name: 'config_path',
        description:
          'Path to the Osquery configuration file. This path can be relative to the folder where the Wazuh agent is running.',
        type: 'input',
        required: true
      },
      {
        name: 'add_labels',
        description: 'Add the agent labels defined as decorators.',
        type: 'switch',
        required: true,
        default_value: true
      },
      {
        name: 'pack',
        description:
          'Add a query pack to the configuration. This option can be defined multiple times.',
        type: 'input',
        required: true,
        extraAttr: {
          name: { value: 'custom_pack', type: 'input' }
        }
      }
    ]
  },
  wodle_command: {
    id: 'wodle_command',
    isWodle: true,
    type: 2,
    name: 'Command wodle',
    extraSteps: `Remote commands may be specified in the centralized configuration, however, they are disabled by default due to security reasons.
  When setting commands in a shared agent configuration, you must enable remote commands for Agent Modules.
  This is enabled by adding the following line to the file etc/local_internal_options.conf in the agent:
  wazuh_command.remote_commands=1`,
    description: 'Configuration options of the Command wodle.',
    options: [
      {
        name: 'disabled',
        description: 'Disable the Command wodle.',
        type: 'switch',
        required: true
      },
      {
        name: 'command',
        description: 'Path and arguments of the command to be executed.',
        type: 'input',
        required: true
      },
      {
        name: 'tag',
        description: 'Descriptive name for the command.',
        type: 'input',
        required: true
      },
      {
        name: 'interval',
        description: 'Time between commands executions.',
        type: 'input',
        required: true,
        default_value: '2s'
      },
      {
        name: 'run_on_start',
        description: 'Run command immediately when service is started.',
        type: 'switch',
        default_value: true
      },
      {
        name: 'timeout',
        description:
          'Timeout for each command to wait for the end of the execution. Whether this parameter is set to 0, it will wait indefinitely for the end of the process. However, if the timeout is other than 0, the execution will finished if it expires.',
        type: 'input'
      },
      {
        name: 'verify_md5',
        description: 'Verify the binary MD5 sum.',
        type: 'switch',
        default_value: false
      },
      {
        name: 'verify_sha256',
        description: 'Verify the binary SHA256 sum.',
        type: 'switch',
        default_value: false
      },
      {
        name: 'verify_sha1',
        description: 'Verify the binary SHA1 sum.',
        type: 'switch',
        default_value: false
      },
      {
        name: 'skip_verification',
        description:
          'Run the command defined although the checksum does not match. In this case, the agent will log that the checksum verification failed but will run the application.',
        type: 'switch',
        default_value: false
      }
    ]
  },
  'open-scap': {
    isWodle: true,
    id: 'open-scap',
    name: 'OpenSCAP wodle',
    description: 'Configuration options of the OpenSCAP wodle.',
    type: 2,
    options: [
      {
        name: 'disabled',
        description: 'Disable the OpenSCAP wodle.',
        type: 'switch',
        required: true,
        default_value: false
      },
      {
        name: 'timeout',
        description: 'Timeout for each evaluation.',
        type: 'input',
        required: true,
        default_value: '1800'
      },
      {
        name: 'scan-on-start',
        description: 'Run evaluation immediately when service is started.',
        type: 'switch',
        required: true,
        default_value: true
      },
      {
        name: 'content',
        description: 'Define an evaluation.',
        type: 'input',
        required: true,
        extraTag: 'profile',
        extraAttr: {
          type: { type: 'input' },
          path: { type: 'input' },
          timeout: { type: 'input' },
          'xccdf-id': { type: 'input' },
          'oval-id': { type: 'input' },
          'datastream-id': { type: 'input' },
          cpe: { type: 'input' }
        }
      }
    ]
  },
  'cis-cat': {
    isWodle: true,
    id: 'cis-cat',
    name: 'CIS-CAT wodle',
    description: 'Configuration options of the CIS-CAT wodle.',
    extraSteps: `CIS-CAT is not installed by default. It is a proprietary software that you have to obtain for using this module.`,
    type: 0,
    options: [
      {
        name: 'disabled',
        description: 'Disable the CIS-CAT wodle.',
        type: 'switch',
        required: true,
        default_value: false
      },
      {
        name: 'timeout',
        description:
          'Timeout for each evaluation. In case the execution takes longer that the specified timeout, it stops.',
        type: 'input',
        required: true,
        default_value: '1800'
      },
      {
        name: 'java_path',
        description:
          'Define where Java is located. If this parameter is not set, the wodle will search for the Java location in the default environment variable $PATH.',
        type: 'input',
        required: true,
      },
      {
        name: 'ciscat_path',
        description: 'Define where CIS-CAT is located.',
        type: 'input',
        required: true,
      },
      {
        name: 'interval',
        description: 'Interval between CIS-CAT executions.',
        type: 'input',
        required: true,
        default_value: '1d'
      },
      {
        name: 'scan-on-start',
        description: 'Run evaluation immediately when service is started.',
        type: 'switch',
        default_value: true
      },
      {
        name: 'day',
        description: 'Day of the month to run the CIS-CAT scan.',
        type: 'input',
      },
      {
        name: 'wday',
        description:
          'Day of the week to run the CIS-CAT scan. This option is not compatible with the day option.',
        type: 'input',
      },
      {
        name: 'time',
        description:
          'Time of the day to run the scan. It has to be represented in the format hh:mm.',
        type: 'input',
      },
      {
        name: 'content',
        description: 'Define an evaluation.',
        type: 'input',
        extraTag: 'profile',
        extraAttr: {
          type: { type: 'input' },
          path: { type: 'input' },
          timeout: { type: 'input' }
        }
      }
    ]
  },
  'rootcheck': {
    id: 'rootcheck',
    name: 'Policy monitoring',
    description: 'Configuration options for policy monitoring and anomaly detection.',
    type: 2,
    options: [
      {
        name: 'disabled',
        description: 'Disables the execution of rootcheck.',
        type: 'switch',
        required: true,
      },
      {
        name: 'base_directory',
        description: 'The base directory that will be prefixed to the following options: rootkit_files, rootkit_trojans and systems_audit',
        type: 'input',
        required: true,
        default_value: '/'
      },
      {
        name: 'ignore',
        description:
          'List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories will be ignored during scans.',
        type: 'input',
        required: true,
        extraAttr: {
          type: { type: 'input' },
        }
      },
      {
        name: 'rootkit_files',
        description:
          'Change the location of the rootkit files database.',
        type: 'input',
        required: true
      },
      {
        name: 'rootkit_trojans',
        description:
          'Change the location of the rootkit trojans database.',
        type: 'input',
        required: true
      },
      {
        name: 'windows_audit',
        description:
          'Specifies the path to a Windows audit definition file.',
        type: 'list',
      },
      {
        name: 'system_audit',
        description:
          'Specifies the path to an audit definition file for Unix-like systems.',
        type: 'list',
      },
      {
        name: 'windows_apps',
        description: 'Specifies the path to a Windows application definition file.',
        type: 'list',
      },
      {
        name: 'windows_malware',
        description: 'Specifies the path to a Windows malware definitions file.',
        type: 'list',
      },
      {
        name: 'scanall',
        description: 'Tells rootcheck to scan the entire system. This option may lead to some false positives.',
        type: 'switch',
        default_value: false,
      },
      {
        name: 'frequency',
        description: 'Frequency that the rootcheck is going to be executed (in seconds).',
        type: 'input',
        default_value: '36000',
      },
      {
        name: 'check_dev',
        description: 'Enable or disable the checking of /dev.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_files',
        description: 'Enable or disable the checking of files.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_if',
        description: 'Enable or disable the checking of network interfaces.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_pids',
        description: 'Enable or disable the checking of process ID’s.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_ports',
        description: 'Enable or disable the checking of network ports.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_sys',
        description: 'Enable or disable checking for anomalous file system objects.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_trojans',
        description: 'Enable or disable checking for trojans.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_unixaudit',
        description: 'Enable or disable the checking of unixaudit.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_winapps',
        description: 'Enable or disable the checking of winapps.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_winaudit',
        description: 'Enable or disable the checking of winaudit.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'check_winmalware',
        description: 'Enable or disable checking for Windows malware.',
        type: 'switch',
        default_value: true,
      },
      {
        name: 'skip_nfs',
        description: 'Enable or disable the scanning of network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.',
        type: 'switch',
        default_value: true,
      }, 
    ]
  }
};