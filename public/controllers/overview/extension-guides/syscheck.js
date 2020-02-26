export default {
  id: 'syscheck',
  name: 'File integrity monitoring',
  description: 'Configuration options for file integrity monitoring.',
  documentation_link: 'https://documentation.wazuh.com/current/user-manual/reference/ossec-conf/syscheck.html#nodiff',
  // icon: 'logoAWS',
  type: 2,
  steps: [
    {
      title: 'Directories',
      description: 'Add or remove directories to be monitored',
      buttons: [
        {
          text: 'Add directory',
          icon_type: 'plusInCircle',
          action: 'add_element_to_step',
          add_element_to_step: {
            name: 'directories',
            description: `Use this option to add or remove directories to be monitored. The directories must be comma separated.
        All files and subdirectories within the noted directories will also be monitored.              
        Drive letters without directories are not valid. At a minimum the ‘.’ should be included (D:\.).
        This is to be set on the system to be monitored (or in the agent.conf, if appropriate).`,
            type: 'input',
            required: true,
            removable: true,
            list: true,
            placeholder: '/etc,/usr/bin,/usr/sbin,/bin,/sbin',
            validate_error_message: 'Any directory comma separated',
            attributes_layout: {
              columns: 4
            },
            attributes: [
              {
                name: 'realtime',
                description: `This will enable real-time/continuous monitoring on Linux (using the inotify system calls) and Windows systems.
                Real time only works with directories, not individual files.`,
                type: 'switch',
                default_value: true
              },
              {
                name: 'who-data',
                description: 'This will enable who-data monitoring on Linux and Windows systems.',
                type: 'switch',
                default_value: false,
                options: [
                  {
                    name: 'restart_audit',
                    type: 'switch',
                    default_value: false
                  }
                ]
              },
              {
                name: 'report_changes',
                description: `Report file changes. This is limited to text files at this time.`,
                type: 'switch',
                default_value: true
              },
              {
                name: 'check_all',
                description: `All attributes with the prefix check_ will be activated.`,
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
                description: `Check only the SHA-1 hash of the files.`,
                type: 'switch',
                default_value: false
              },
              {
                name: 'check_md5sum',
                description: `Check only the MD5 hash of the files.`,
                type: 'switch',
                default_value: false
              },
              {
                name: 'check_sha256sum',
                description: `Check only the SHA-256 hash of the files.`,
                type: 'switch',
                default_value: false
              },
              {
                name: 'check_size',
                description: `Check the size of the files.`,
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
                default_value: false
              },
              {
                name: 'check_attrs',
                description: `Check the attributes of the files.
                Available for Windows.`,
                type: 'switch',
                default_value: false
              },
              {
                name: 'check_mtime',
                description: `Check the modification time of a file.`,
                type: 'switch',
                default_value: false
              },
              {
                name: 'check_inode',
                description: `Check the file inode.
                Available for UNIX. On Windows, inode will always be 0.`,
                type: 'switch',
                default_value: false
              },
              {
                name: 'restrict',
                description: `Limit checks to files containing the entered string in the file name.
                Any directory or file name (but not a path) is allowed`,
                type: 'input',
                default_value: true,
                validate_error_message: 'Any directory or file name (but not a path) is allowed'
              },
              {
                name: 'tags',
                description: `Add tags to alerts for monitored directories.`,
                type: 'input',
                placeholder: 'Tags list separated by commas',
                default_value: '',
                validate_error_message: 'Tags list separated by commas'
              },
              {
                name: 'recursion_level',
                description: `Limits the maximum level of recursion allowed.`,
                type: 'input-number',
                default_value: 0,
                values: {min: 0, max: 320},
                validate_error_message: `Any integer between 0 and 320`
              },
              {
                name: 'follow_symbolic_link',
                description: `Follow symbolic links (directories or files). The default value is “no”. The setting is available for UNIX systems.
                If set, realtime works as usual (with symbolic links to directories, not files).`,
                type: 'switch',
                default_value: true
              }
            ],
          }
        }
      ],
      elements: [
        {
          name: 'directories',
          description: `Use this option to add or remove directories to be monitored. The directories must be comma separated.
      All files and subdirectories within the noted directories will also be monitored.              
      Drive letters without directories are not valid. At a minimum the ‘.’ should be included (D:\.).
      This is to be set on the system to be monitored (or in the agent.conf, if appropriate).`,
          type: 'input',
          enabled: true,
          toggleable: false,
          removable: false,
          list: true,
          placeholder: '/etc,/usr/bin,/usr/sbin,/bin,/sbin',
          default_value: '/etc,/usr/bin,/usr/sbin,/bin,/sbin',
          validate_error_message: 'Any directory comma separated',
          attributes_layout: {
            columns: 4
          },
          attributes: [
            {
              name: 'realtime',
              description: `This will enable real-time/continuous monitoring on Linux (using the inotify system calls) and Windows systems.
              Real time only works with directories, not individual files.`,
              type: 'switch',
              default_value: false,
            },
            {
              name: 'who-data',
              description: 'This will enable who-data monitoring on Linux and Windows systems.',
              type: 'switch',
              default_value: false,
              options: [
                {
                  name: 'restart_audit', //TODO: see if remove or what happens
                  type: 'switch',
                  default_value: false
                }
              ]
            },
            {
              name: 'report_changes',
              description: `Report file changes. This is limited to text files at this time.`,
              type: 'switch',
              default_value: true
            },
            {
              name: 'check_all',
              description: `All attributes with the prefix check_ will be activated.`,
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
              description: `Check only the SHA-1 hash of the files.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_md5sum',
              description: `Check only the MD5 hash of the files.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_sha256sum',
              description: `Check only the SHA-256 hash of the files.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_size',
              description: `Check the size of the files.`,
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
              default_value: false
            },
            {
              name: 'check_attrs',
              description: `Check the attributes of the files.
              Available for Windows.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_mtime',
              description: `Check the modification time of a file.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'check_inode',
              description: `Check the file inode.
              Available for UNIX. On Windows, inode will always be 0.`,
              type: 'switch',
              default_value: false
            },
            {
              name: 'restrict',
              description: `Limit checks to files containing the entered string in the file name.
              Any directory or file name (but not a path) is allowed`,
              type: 'input',
              default_value: true,
              validate_error_message: 'Any directory or file name (but not a path) is allowed'
            },
            {
              name: 'tags',
              description: `Add tags to alerts for monitored directories.`,
              type: 'input',
              placeholder: 'Tags list separated by commas',
              default_value: '',
              validate_error_message: 'Tags list separated by commas'
            },
            {
              name: 'recursion_level',
              description: `Limits the maximum level of recursion allowed.`,
              type: 'input-number',
              default_value: 0,
              values: {min: 0, max: 320},
              validate_error_message: `Any integer between 0 and 320`
            },
            {
              name: 'follow_symbolic_link',
              description: `Follow symbolic links (directories or files). The default value is “no”. The setting is available for UNIX systems.
              If set, realtime works as usual (with symbolic links to directories, not files).`,
              type: 'switch',
              default_value: true
            }
          ]
        }
      ]
    },
    {
      title: 'ignore',
      description: 'List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories are still checked, but the results are ignored.',
      buttons: [
        {
          text: 'Add ignore',
          icon_type: 'plusInCircle',
          action: 'add_element_to_step',
          add_element_to_step: {
            name: 'ignore',
            description: `List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories are still checked, but the results are ignored.`,
            type: 'input',
            placeholder: '/etc/mtab',
            toggleable: false,
            removable: true,
            enabled: true,
            list: true,
            validate_error_message: 'Any directory or file name.',
            attributes: [
              {
                name: 'type',
                description: 'This is a simple regex pattern to filter out files so alerts are not generated.',
                type: 'input',
                validate_error_message: 'sregex'
              }
            ]
          }
        }
      ]
    },
    {
      title: 'nodiff',
      description: 'List of files to not compute the diff (one entry per line). It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.',
      buttons: [
        {
          text: 'Add nodiff',
          icon_type: 'plusInCircle',
          action: 'add_element_to_step',
          add_element_to_step: {
            name: 'nodiff',
            description: `List of files to not compute the diff (one entry per line). It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.`,
            type: 'input',
            placeholder: '/etc/ssl/private.key',
            toggleable: false,
            enabled: true,
            removable: true,
            list: true,
            validate_error_message: 'Any file name.',
            attributes: [
              {
                name: 'type',
                description: 'This is a simple regex pattern to filter out files so alerts are not generated.',
                type: 'input',
                validate_error_message: 'sregex'
              }
            ]
          }
        }
      ]
    },
    {
      title: 'scan_day',
      description: '',
      buttons: [
        {
          text: 'Add scan_day',
          icon_type: 'plusInCircle',
          action: 'add_element_to_step',
          add_element_to_step: {
            name: 'scan_day',
            description: `Day of the week to run the scans(one entry per line). Multiple lines may be entered to include multiple registry entries.`,
            type: 'select',
            toggleable: false,
            removable: true,
            enabled: true,
            list: true,
            values: [
              {value: 'monday', text: 'Monday'},
              {value: 'tuesday', text: 'Tuesday'},
              {value: 'wednesday', text: 'Wednesday'},
              {value: 'thursday', text: 'Thursday'},
              {value: 'friday', text: 'Friday'},
              {value: 'saturday', text: 'Saturday'},
              {value: 'sunday', text: 'Sunday'}
            ],
            default_value: 'monday',
            //TODO: day of week?
            validate_error_message: `Day of the week.`
          }
        }
      ]
    },
    {
      title: 'windows_registry',
      description: 'Use this option to monitor specified Windows registry entries (one entry per line). Multiple lines may be entered to include multiple registry entries.',
      buttons: [
        {
          text: 'Add windows_registry',
          icon_type: 'plusInCircle',
          action: 'add_element_to_step',
          add_element_to_step: {
            name: 'windows_registry',
            description: `Use this option to monitor specified Windows registry entries (one entry per line). Multiple lines may be entered to include multiple registry entries.`,
            info: 'New entries will not trigger alerts, only changes to existing entries.',
            type: 'input',
            placeholder: 'HKEY_LOCAL_MACHINE\\Software',
            default_value: 'HKEY_LOCAL_MACHINE\\Software',
            required: true,
            list: true,
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
                validate_error_message: 'Tags list separated by commas'
              }
            ]
          }
        }
      ]
    },
    {
      title: 'registry_ignore',
      description: 'List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.',
      buttons: [
        {
          text: 'Add registry_ignore',
          icon_type: 'plusInCircle',
          action: 'add_element_to_step',
          add_element_to_step: {
            name: 'registry_ignore',
            description: 'List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.',
            type: 'input',
            placeholder: 'Any registry entry.',
            validate_error_message: 'Any registry entry.',
            required: true,
            removable: true,
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
                placeholder: 'sregex',
                validate_error_message: 'sregex',
              }
            ]
          }
        }
      ]
    },
    {
      title: 'Other settings',
      description: 'Other configurations',
      elements: [
        {
          name: 'frequency',
          description: `Frequency that the syscheck will be run (in seconds).`,
          type: 'input-number',
          default_value: 43200,
          values: {min: 0},
          validate_error_message: `A positive number, time in seconds.`
        },
        {
          name: 'scan_time',
          description: `Time to run the scans. Times may be represented as 9pm or 8:30.`,
          type: 'input',
          //TODO: time of day?
          placeholder: '9pm or 8:30',
          validate_error_message: `Time of day`,
          warning: 'This may delay the initialization of real-time scans.'
        },
        {
          name: 'auto_ignore',
          description: `Specifies whether or not syscheck will ignore files that change too many times (manager only).`,
          info: 'It is valid on: server and local.',
          type: 'switch',
          attributes: [
            {
              name: 'frequency',
              description: 'Number of times the alert can be repeated in the’timeframe’ time interval.',
              type: 'input-number',
              values: {min: 1, max: 99},
              default_value: 10,
              validate_error_message: 'Any number between 1 and 99.'
            },
            {
              name: 'timeframe',
              description: 'Time interval in which the number of alerts generated by a file accumulates.',
              type: 'input-number',
              values: {min: 1, max: 43200},
              default_value: 3600,
              validate_error_message: 'Any number between 1 and 43200.'
            }
          ]
        },
        {
          name: 'alert_new_files',
          description: `Specifies if syscheck should alert when new files are created.`,
          info: 'It is valid on: server and local.',
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
          name: 'allow_remote_prefilter_cmd',
          new: '3.11.4',
          description: 'Allows prefilter_cmd option apply in remote configuration (agent.conf).',
          type: 'switch',
          default_value: false
        },
        {
          name: 'prefilter_cmd',
          description: 'Run to prevent prelinking from creating false positives.',
          type: 'input',
          placeholder: 'Command to prevent prelinking.',
        },
        {
          name: 'skip_nfs',
          description: 'Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.',
          type: 'switch',
          default_value: true
        },
        {
          name: 'windows_audit_interval',
          description: 'This option sets the frequency in seconds with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.',
          type: 'input-number',
          values: { min: 1, max: 9999 },
          default_value: 300,
          validate_error_message: 'Any number from 1 to 9999'
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
                type: 'input',
                placeholder: 'Any string separated by commas',
                default_value: '',
                validate_error_message: 'Any string separated by commas'
              },
              {
                name: 'startup_healthcheck',
                description: 'This option allows to disable the Audit health check during the Whodata engine starting. This option is only available for Linux systems with Audit.',
                type: 'switch',
                default_value: true
              }
            ]
          }
      ]
    },

    // {
    //   name: 'restart_audit',
    //   description: 'Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.',
    //   type: 'switch', //TODO: inner whoData
    //   default_value: true
    // },
    // {
    //   name: 'whodata',
    //   description: 'The Whodata options will be configured inside this tag.',
    //   options: [
    //     {
    //       name: 'restart_audit',
    //       description: 'Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.',
    //       type: 'switch',
    //       default_value: true
    //     },
    //     {
    //       name: 'audit_key',
    //       description: 'Set up the FIM engine to collect the Audit events using keys with audit_key. Wazuh will include in its FIM baseline those events being monitored by Audit using audit_key. For those systems where Audit is already set to monitor folders for other purposes, Wazuh can collect events generated as a key from audit_key. This option is only available for Linux systems with Audit.',
    //       type: 'input',
    //       default_value: ''
    //     },
    //     {
    //       name: 'startup_healthcheck',
    //       description: 'This option allows to disable the Audit health check during the Whodata engine starting. This option is only available for Linux systems with Audit.',
    //       type: 'switch',
    //       default_value: true
    //     }
    //   ]
    // }
    // {
    //   name: 'ignore',
    //   description:
    //     'List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories are still checked, but the results are ignored.',
    //   type: 'list',
    //   required: true
    // },
    // {
    //   name: 'nodiff',
    //   description:
    //     'List of files to not compute the diff (one entry per line). It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.',
    //   type: 'list',
    //   required: true
    // },
    // {
    //   name: 'frequency',
    //   description: 'Frequency that the syscheck will be run (in seconds).',
    //   type: 'input',
    //   default_value: 43200
    // },
    // {
    //   name: 'scan_time',
    //   description:
    //     'Time to run the scans. Times may be represented as 9pm or 8:30.',
    //   type: 'input'
    // },
    // {
    //   name: 'scan_day',
    //   description:
    //     'Day of the week to run the scans(one entry per line). Multiple lines may be entered to include multiple registry entries.',
    //   type: 'input'
    // },
    // {
    //   name: 'auto_ignore',
    //   description:
    //     'Specifies whether or not syscheck will ignore files that change too many times (manager only).',
    //   type: 'switch',
    //   default_value: false
    // },
    // {
    //   name: 'alert_new_files',
    //   description:
    //     'Specifies if syscheck should alert when new files are created.',
    //   type: 'switch',
    //   default_value: true
    // },
    // {
    //   name: 'scan_on_start',
    //   description: 'Specifies if syscheck scans immediately when started.',
    //   type: 'switch',
    //   default_value: true
    // },
    // {
    //   name: 'windows_registry',
    //   description:
    //     'Use this option to monitor specified Windows registry entries (one entry per line). Multiple lines may be entered to include multiple registry entries.',
    //   type: 'list',
    //   required: true
    // },
    // {
    //   name: 'registry_ignore',
    //   description:
    //     'List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.',
    //   type: 'list'
    // },
    // {
    //   name: 'prefilter_cmd',
    //   description: 'Run to prevent prelinking from creating false positives.',
    //   type: 'input'
    // },
    // {
    //   name: 'skip_nfs',
    //   description:
    //     'Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.',
    //   type: 'switch',
    //   default_value: true
    // },
    // {
    //   name: 'remove_old_diff',
    //   description:
    //     'Specifies if Syscheck should delete the local snapshots that are not currently being monitorized.',
    //   type: 'switch',
    //   default_value: true
    // },
    // {
    //   name: 'restart_audit',
    //   description:
    //     'Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.',
    //   type: 'switch',
    //   default_value: true
    // },
    // {
    //   name: 'windows_audit_interval',
    //   description:
    //     'This option sets the frequency with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.',
    //   type: 'input',
    //   default_value: 300
    // }
  ]
}
// export default {
//   id: 'syscheck',
//   name: 'File integrity monitoring',
//   description: 'Configuration options for file integrity monitoring.',
//   icon: 'logoAWS',
//   type: 2,
//   options: [
//     {
//       name: 'directories',
//       description: `Use this option to add or remove directories to be monitored. The directories must be comma separated.
//   All files and subdirectories within the noted directories will also be monitored.              
//   Drive letters without directories are not valid. At a minimum the ‘.’ should be included (D:\.).
//   This is to be set on the system to be monitored (or in the agent.conf, if appropriate).`,
//       type: 'input',
//       required: true,
//       extraAttr: {
//         realtime: { default_value: false, type: 'switch' },
//         whodata: { default_value: false, type: 'switch' },
//         report_changes: { default_value: false, type: 'switch' },
//         check_all: { default_value: true, type: 'switch' },
//         check_sum: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_sha1sum: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_md5sum: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_sha256sum: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_size: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_owner: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_group: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_perm: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_mtime: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         check_inode: {
//           default_value: false,
//           requirement: 'check_all',
//           type: 'switch'
//         },
//         follow_symbolic_link: { default_value: false, type: 'switch' },
//         restrict: { type: 'input' },
//         tags: { type: 'input' },
//         recursion_level: { type: 'input' }
//       }
//     },
//     {
//       name: 'ignore',
//       description:
//         'List of files or directories to be ignored (one entry per line). Multiple lines may be entered to include multiple files or directories. These files and directories are still checked, but the results are ignored.',
//       type: 'list',
//       required: true
//     },
//     {
//       name: 'nodiff',
//       description:
//         'List of files to not compute the diff (one entry per line). It could be used for sensitive files like a private key, credentials stored in a file or database configuration, avoiding data leaking by sending the file content changes through alerts.',
//       type: 'list',
//       required: true
//     },
//     {
//       name: 'frequency',
//       description: 'Frequency that the syscheck will be run (in seconds).',
//       type: 'input',
//       default_value: 43200
//     },
//     {
//       name: 'scan_time',
//       description:
//         'Time to run the scans. Times may be represented as 9pm or 8:30.',
//       type: 'input'
//     },
//     {
//       name: 'scan_day',
//       description:
//         'Day of the week to run the scans(one entry per line). Multiple lines may be entered to include multiple registry entries.',
//       type: 'input'
//     },
//     {
//       name: 'auto_ignore',
//       description:
//         'Specifies whether or not syscheck will ignore files that change too many times (manager only).',
//       type: 'switch',
//       default_value: false
//     },
//     {
//       name: 'alert_new_files',
//       description:
//         'Specifies if syscheck should alert when new files are created.',
//       type: 'switch',
//       default_value: true
//     },
//     {
//       name: 'scan_on_start',
//       description: 'Specifies if syscheck scans immediately when started.',
//       type: 'switch',
//       default_value: true
//     },
//     {
//       name: 'windows_registry',
//       description:
//         'Use this option to monitor specified Windows registry entries (one entry per line). Multiple lines may be entered to include multiple registry entries.',
//       type: 'list',
//       required: true
//     },
//     {
//       name: 'registry_ignore',
//       description:
//         'List of registry entries to be ignored. (one entry per line). Multiple lines may be entered to include multiple registry entries.',
//       type: 'list'
//     },
//     {
//       name: 'prefilter_cmd',
//       description: 'Run to prevent prelinking from creating false positives.',
//       type: 'input'
//     },
//     {
//       name: 'skip_nfs',
//       description:
//         'Specifies if syscheck should scan network mounted filesystems (Works on Linux and FreeBSD). Currently, skip_nfs will exclude checking files on CIFS or NFS mounts.',
//       type: 'switch',
//       default_value: true
//     },
//     {
//       name: 'remove_old_diff',
//       description:
//         'Specifies if Syscheck should delete the local snapshots that are not currently being monitorized.',
//       type: 'switch',
//       default_value: true
//     },
//     {
//       name: 'restart_audit',
//       description:
//         'Allow the system to restart Auditd after installing the plugin. Note that setting this field to no the new whodata rules won’t be applied automatically.',
//       type: 'switch',
//       default_value: true
//     },
//     {
//       name: 'windows_audit_interval',
//       description:
//         'This option sets the frequency with which the Windows agent will check that the SACLs of the directories monitored in whodata mode are correct.',
//       type: 'input',
//       default_value: 300
//     }
//   ]
// }