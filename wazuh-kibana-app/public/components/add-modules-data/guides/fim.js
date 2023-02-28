/*
* Wazuh app - Vulnerabilities interactive extension guide
* Copyright (C) 2015-2022 Wazuh, Inc.
*
* This program is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* Find more information about this on the LICENSE file.
*/
import { webDocumentationLink } from "../../../../common/services/web_documentation";

export default {
  id: 'fim',
  xml_tag: 'syscheck',
  name: 'Integrity monitoring',
  description: 'Configuration options for file integrity monitoring.',
  category: 'Security information management',
  documentation_link: webDocumentationLink('user-manual/reference/ossec-conf/syscheck.html'),
  icon: 'filebeatApp',
  avaliable_for_manager: true,
  avaliable_for_agent: true,
  steps: [
    {
      title: 'Directories/files to monitoring',
      description: 'Add or remove directories to be monitored. You can add multiple directories with different monitoring configurations.',
      elements: [
        {
          name: 'directories',
          description: `Use this option to add or remove directories to be monitored. The directories must be comma separated.
          All files and subdirectories within the noted directories will also be monitored.              
          Drive letters without directories are not valid. At a minimum the ‘.’ should be included (D:\\.).
          This is to be set on the system to be monitored (or in the agent.conf, if appropriate).`,
          type: 'input',
          required: true,
          removable: true,
          repeatable: true,
          repeatable_insert_first: true,
          repeatable_insert_first_properties: {
            removable: false
          },
          placeholder: 'Any directory comma separated',
          default_value: '/etc,/usr/bin,/usr/sbin,/bin,/sbin',
          attributes: [
            {
              name: 'realtime',
              description: `This will enable real-time/continuous monitoring on Linux (using the inotify system calls) and Windows systems.
              Real time only works with directories, not individual files.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'who-data',
              description: 'This will enable who-data monitoring on Linux and Windows systems.',
              type: 'switch',
              default_value: false
            },
            {
              name: 'report_changes',
              description: 'Report file changes. This is limited to text files at this time.',
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_all',
              description: 'All attributes with the prefix check_ will be activated.',
              type: 'switch',
              default_value: true
            },
            {
              name: 'check_sum',
              description: `Check the MD5, SHA-1 and SHA-256 hashes of the files.
              Same as using check_md5sum="yes", check_sha1sum="yes" and check_sha256sum="yes" at the same time.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_sha1sum',
              description: 'Check only the SHA-1 hash of the files.',
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_md5sum',
              description: 'Check only the MD5 hash of the files.',
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_sha256sum',
              description: 'Check only the SHA-256 hash of the files.',
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_size',
              description: 'Check the size of the files.',
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_owner',
              description: `Check the owner of the files.
              On Windows, uid will always be 0.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_group',
              description: `Check the group owner of the files/directories.
              Available for UNIX. On Windows, gid will always be 0 and the group name will be blank.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_perm',
              description: `Check the permission of the files/directories.
              On Windows, a list of denied and allowed permissions will be given for each user or group since version 3.8.0.
              Only works on NTFS partitions on Windows systems.`,
              type: 'switch',
              default_value: false,
              agent_os: 'windows'
            },
            {
              name: 'check_attrs',
              description: `Check the attributes of the files.
              Available for Windows.`,
              type: 'switch',
              default_value: false,
              agent_os: 'windows'
            },
            {
              name: 'check_mtime',
              description: 'Check the modification time of a file.',
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_inode',
              description: `Check the file inode.
              Available for UNIX. On Windows, inode will always be 0.`,
              type: 'switch',
              default_value: false,
              agent_os: 'linux'
            },
            {
              name: 'restrict',
              description: `Limit checks to files containing the entered string in the file name.
              Any directory or file name (but not a path) is allowed`,
              type: 'input',
              placeholder: 'sregex',
              default_value: 'sregex',
              field_read_only: true,
              validate_error_message: 'Any directory or file name (but not a path) is allowed'
            },
            {
              name: 'tags',
              description: 'Add tags to alerts for monitored directories.',
              type: 'input',
              placeholder: 'Tags list separated by commas'
            },
            {
              name: 'recursion_level',
              description: 'Limits the maximum level of recursion allowed.',
              type: 'input-number',
              default_value: '',
              values: { min: 0, max: 320 },
              placeholder: 'Any integer between 0 and 320',
              validate_error_message: 'Any integer between 0 and 320'
            },
            {
              name: 'follow_symbolic_link',
              description: `Follow symbolic links (directories or files). The default value is “no”. The setting is available for UNIX systems.
              If set, realtime works as usual (with symbolic links to directories, not files).`,
              type: 'switch',
              default_value: false,
              agent_os: 'linux'
            }
          ]
        }
      ]
    },
    {
      title: 'Ignore directories and/or files',
      description: 'List of files or directories to be ignored. You can add multiple times this option. These files and directories are still checked, but the results are ignored.',
      elements: [
        {
          name: 'ignore',
          description: 'File or directory to be ignored.',
          type: 'input',
          removable: true,
          required: true,
          repeatable: true,
          placeholder: 'File/directory path',
          attributes: [
            {
              name: 'type',
              description: 'This is a simple regex pattern to filter out files so alerts are not generated.',
              type: 'input',
              placeholder: 'sregex',
              default_value: 'sregex',
              field_read_only: true
            }
          ]
        }
      ]
    },
    {
      title: 'Not compute',
      description: 'List of files to not compute the diff. You can add multiple times this option. It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.',
      elements: [
        {
          name: 'nodiff',
          description: 'File to not compute the diff.',
          type: 'input',
          placeholder: 'File path',
          required: true,
          removable: true,
          repeatable: true,
          validate_error_message: 'Any file name. e.g. /etc/ssl/private.key',
          attributes: [
            {
              name: 'type',
              description: 'This is a simple regex pattern to filter out files so alerts are not generated.',
              type: 'input',
              placeholder: 'sregex',
              default_value: 'sregex',
              field_read_only: true
            }
          ]
        }
      ]
    },
    {
      title: 'Scan day',
      description: 'Day of the week to run the scans. You can add multiple times this option.',
      elements: [
        {
          name: 'scan_day',
          description: 'Day of the week to run the scans.',
          type: 'select',
          removable: true,
          required: true,
          repeatable: true,
          values: [
            {value: 'sunday', text: 'sunday'},
            {value: 'monday', text: 'monday'},
            {value: 'tuesday', text: 'tuesday'},
            {value: 'wednesday', text: 'wednesday'},
            {value: 'thursday', text: 'thursday'},
            {value: 'friday', text: 'friday'},
            {value: 'saturday', text: 'saturday'}
          ],
          default_value: 'sunday',
          validate_error_message: `Day of the week.`
        }
      ]
    },
    {
      title: 'Windows registry',
      description: 'Use this option to monitor specified Windows registry entries. You can add multiple times this option.',
      elements: [
        {
          name: 'windows_registry',
          description: 'Use this option to monitor specified Windows registry entries',
          info: 'New entries will not trigger alerts, only changes to existing entries.',
          type: 'input',
          placeholder: 'Windows registry entry',
          default_value: 'HKEY_LOCAL_MACHINE\\Software',
          required: true,
          repeatable: true,
          removable: true,
          agent_os: 'windows',
          attributes: [
            {
              name: 'arch',
              description: 'Select the Registry view depending on the architecture.',
              type: 'select',
              values: [{value: '32bit', text: '32bit'}, {value: '64bit', text: '64bit'}, {value: 'both', text: 'both'}],
              default_value: '32bit'
            },
            {
              name: 'tags',
              description: 'Add tags to alerts for monitored registry entries.',
              type: 'input',
              placeholder: 'Tags list separated by commas'
            }
          ]
        }
      ]
    },
    {
      title: 'Registry ignore',
      description: 'List of registry entries to be ignored.',
      elements: [
        {
          name: 'registry_ignore',
          description: 'List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.',
          type: 'input',
          placeholder: 'Any registry entry.',
          validate_error_message: 'Any registry entry.',
          toggeable: true,
          attributes: [
            {
              name: 'arch',
              description: 'Select the Registry to ignore depending on the architecture.',
              type: 'select',
              values: [{value: '32bit', text: '32bit'}, {value: '64bit', text: '64bit'}, {value: 'both', text: 'both'}],
              default_value: '32bit'
            },
            {
              name: 'tags',
              description: 'This is a simple regex pattern to filter out files so alerts are not generated.',
              type: 'input',
              placeholder: 'sregex'
            }
          ]
        }
      ]
    },
    {
      title: 'Other settings',
      description: '',
      elements: [
        {
          name: 'frequency',
          description: 'Frequency that the syscheck will be run (in seconds).',
          type: 'input-number',
          required: true,
          default_value: 43200,
          values: { min: 1 },
          placeholder: 'Time in seconds.',
          validate_error_message: `A positive number, time in seconds.`
        },
        {
          name: 'scan_time',
          description: 'Time to run the scans. Times may be represented as 9pm or 8:30.',
          info: 'This may delay the initialization of real-time scans.',
          type: 'input',
          placeholder: 'Time of day',
          validate_error_message: 'Time of day represented as 9pm or 8:30',
          validate_regex: /^(((0?[1-9]|1[012])(:[0-5][0-9])?am)|(((0?[0-9])|(1[0-9])|(2[0-4]))(:[0-5][0-9])?pm))|(((0?[0-9])|(1[012])|(2[0-4])):([0-5][0-9]))$/,
          warning: 'This may delay the initialization of real-time scans.'
        },
        {
          name: 'auto_ignore',
          description: 'Specifies whether or not syscheck will ignore files that change too many times (manager only).',
          info: 'It is valid on: server and local.',
          type: 'switch',
          agent_type: 'manager',
          show_attributes: true,
          attributes: [
            {
              name: 'frequency',
              description: 'Number of times the alert can be repeated in the \'timeframe\' time interval.',
              type: 'input-number',
              required: true,
              values: { min: 1, max: 99 },
              default_value: 10,
              validate_error_message: 'Any number between 1 and 99.'
            },
            {
              name: 'timeframe',
              description: 'Time interval in which the number of alerts generated by a file accumulates.',
              type: 'input-number',
              required: true,
              placeholder: 'Time in seconds',
              values: { min: 1, max: 43200 },
              default_value: 3600,
              validate_error_message: 'Any number between 1 and 43200.'
            }
          ]
        },
        {
          name: 'alert_new_files',
          description: 'Specifies if syscheck should alert when new files are created.',
          info: 'It is valid on: server and local.',
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
          name: 'allow_remote_prefilter_cmd',
          description: 'Allows prefilter_cmd option apply in remote configuration (agent.conf).',
          info: 'This option only can be activate from the agent side, in its own ossec.conf.',
          type: 'switch',
          default_value: false
        },
        {
          name: 'prefilter_cmd',
          description: 'Run to prevent prelinking from creating false positives.',
          info: `This option may negatively impact performance as the configured command will be run for each file checked.
          This option is ignored when defined at agent.conf if allow_remote_prefilter_cmd is set to no at ossec.conf.`,
          type: 'input',
          placeholder: 'Command to prevent prelinking.'
        },
        {
          name: 'skip_nfs',
          description: 'Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.',
          type: 'switch',
          default_value: true
        },
        {
          name: 'skip_dev',
          description: 'Specifies if syscheck should scan the /dev directory. (Works on Linux and FreeBSD).',
          type: 'switch',
          default_value: true
        },
        {
          name: 'skip_sys',
          description: 'Specifies if syscheck should scan the /sys directory. (Works on Linux).',
          type: 'switch',
          default_value: true
        },
        {
          name: 'skip_proc',
          description: 'Specifies if syscheck should scan the /proc directory. (Works on Linux and FreeBSD).',
          type: 'switch',
          default_value: true
        },
        {
          name: 'windows_audit_interval',
          description: 'This option sets the frequency in seconds with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.',
          type: 'input-number',
          values: { min: 1, max: 9999 },
          default_value: 300,
          placeholer: 'Time in seconds',
          validate_error_message: 'Any number from 1 to 9999',
          agent_os: 'windows'
        },
        {
          name: 'process_priority',
          description: 'Set the nice value for Syscheck process.',
          info: 'The "niceness" scale in Linux goes from -20 to 19, whereas -20 is the highest priority and 19 the lowest priority.',
          type: 'input-number',
          placholder: 'Process priority',
          default_value: 10,
          values: { min: -20, max: 19 },
          validate_error_message: 'Integer number between -20 and 19.'
        },
        {
          name: 'max_eps',
          description: 'Set the maximum event reporting throughput. Events are messages that will produce an alert.',
          info: '0 means disabled.',
          type: 'input-number',
          placholder: 'Process priority',
          default_value: 100,
          values: { min: 0, max: 1000000 },
          validate_error_message: 'Integer number between 0 and 1000000.'
        },
        {
          name: 'database',
          description: 'Specify where is the database going to be stored.',
          type: 'select',
          default_value: 'disk',
          values: [
            { value: 'disk', text: 'disk'},
            { value: 'memory', text: 'memory'}
          ]
        },
        {
          name: 'synchronization',
          description: 'The database synchronization settings will be configured inside this tag.',
          show_options: true,
          options: [
            {
              name: 'enabled',
              description: 'Specifies whether there will be periodic inventory synchronizations or not.',
              type: 'switch',
              default_value: true,
              required: true
            },
            {
              name: 'interval',
              description: 'Specifies the initial number of seconds between every inventory synchronization. If synchronization fails the value will be duplicated until it reaches the value of max_interval.',
              type: 'input',
              default_value: '300s',
              required: true,
              validate_error_message: 'Any number greater than or equal to 0. Allowed sufixes (s, m, h, d).',
              validate_regex: /^[1-9]\d*[s|m|h|d]$/
            },
            {
              name: 'max_interval',
              description: 'Specifies the maximum number of seconds between every inventory synchronization.',
              type: 'input',
              default_value: '1h',
              required: true,
              validate_error_message: 'Any number greater than or equal to 0. Allowed sufixes (s, m, h, d).',
              validate_regex: /^[1-9]\d*[s|m|h|d]$/
            },
            {
              name: 'response_timeout',
              description: 'Specifies the time elapsed in seconds since the agent sends the message to the manager and receives the response. If the response is not received in this interval, the message is marked as unanswered (timed-out) and the agent may start a new synchronization session at the defined interval.',
              type: 'input-number',
              default_value: 30,
              required: true,
              values: { min: 0 },
              validate_error_message: 'Any number greater than or equal to 0.'
            },
            {
              name: 'queue_size',
              description: 'Specifies the queue size of the manager synchronization responses.',
              type: 'input-number',
              default_value: 16384,
              required: true,
              values: { min: 0, max: 1000000 },
              validate_error_message: 'Integer number between 2 and 1000000.'
            },
            {
              name: 'max_eps',
              description: 'Set the maximum synchronization message throughput.',
              info: '0 means disabled.',
              type: 'input-number',
              default_value: 10,
              required: true,
              values: { min: 0, max: 1000000 },
              validate_error_message: 'Integer number between 0 and 1000000. 0 means disabled.'
            }
          ]
        },
        {
            name: 'whodata',
            description: 'The Whodata options will be configured inside this tag.',
            options: [
              {
                name: 'restart_audit',
                description: 'Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.',
                type: 'switch',
                default_value: true
              },
              {
                name: 'audit_key',
                description: 'Set up the FIM engine to collect the Audit events using keys with audit_key. Wazuh will include in its FIM baseline those events being monitored by Audit using audit_key. For those systems where Audit is already set to monitor folders for other purposes, Wazuh can collect events generated as a key from audit_key. This option is only available for Linux systems with Audit.',
                info: 'Audit allow inserting spaces inside the keys, so the spaces inserted inside the field <audit_key> will be part of the key.',
                type: 'input',
                placeholder: 'Any string separated by commas',
                validate_error_message: 'Any string separated by commas',
                agent_os: 'linux'
              },
              {
                name: 'startup_healthcheck',
                description: 'This option allows to disable the Audit health check during the Whodata engine starting. This option is only available for Linux systems with Audit.',
                warning: 'The health check ensures that the rules required by Whodata can be set in Audit correctly and also that the generated events can be obtained. Disabling the health check may cause functioning problems in Whodata and loss of FIM events.',
                type: 'switch',
                default_value: true,
                agent_os: 'linux'
              }
            ]
          }
      ]
    },
  ]
}
