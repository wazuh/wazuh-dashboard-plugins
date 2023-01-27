import { webDocumentationLink } from "../../../common/services/web_documentation";

/*
 * Wazuh app - Agent configuration request objet for exporting it
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const AgentConfiguration = {
  configurations: [
    {
      title: 'Main configurations',
      sections: [
        {
          subtitle: 'Global configuration',
          desc: 'Logging settings that apply to the agent',
          config: [{ component: 'com', configuration: 'logging' }],
          labels: [
            {
              plain: 'Write internal logs in plain text',
              json: 'Write internal logs in JSON format',
              server: 'List of managers to connect'
            }
          ]
        },
        {
          subtitle: 'Communication',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/client.html'),
          desc: 'Settings related to the connection with the manager',
          config: [{ component: 'agent', configuration: 'client' }],
          labels: [
            {
              crypto_method: 'Method used to encrypt communications',
              auto_restart:
                'Auto-restart the agent when receiving valid configuration from manager',
              notify_time:
                'Time (in seconds) between agent checkings to the manager',
              'time-reconnect':
                'Time (in seconds) before attempting to reconnect',
              server: 'List of managers to connect',
              'config-profile': 'Configuration profiles',
              remote_conf: 'Remote configuration is enabled'
            }
          ]
        },
        {
          subtitle: 'Anti-flooding settings',
          docuLink: webDocumentationLink('user-manual/capabilities/antiflooding.html'),
          desc: 'Agent bucket parameters to avoid event flooding',
          config: [{ component: 'agent', configuration: 'buffer' }],
          labels: [
            {
              disabled: 'Buffer disabled',
              queue_size: 'Queue size',
              events_per_second: 'Events per second'
            }
          ]
        },
        {
          subtitle: 'Agent labels',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/labels.html'),
          desc: 'User-defined information about the agent included in alerts',
          config: [{ component: 'agent', configuration: 'labels' }]
        }
      ]
    },
    {
      title: 'Auditing and policy monitoring',
      sections: [
        {
          subtitle: 'Policy monitoring',
          docuLink: webDocumentationLink('pci-dss/policy-monitoring.html'),
          desc:
            'Configuration to ensure compliance with security policies, standards and hardening guides',
          config: [{ component: 'syscheck', configuration: 'rootcheck' }],
          wodle: [{ name: 'sca' }],
          labels: [
            {
              disabled: 'Policy monitoring service disabled',
              base_directory: 'Base directory',
              rootkit_files: 'Rootkit files database path',
              rootkit_trojans: 'Rootkit trojans database path',
              scanall: 'Scan the entire system',
              skip_nfs: 'Skip scan on CIFS/NFS mounts',
              frequency: 'Frequency (in seconds) to run the scan',
              check_dev: 'Check /dev path',
              check_files: 'Check files',
              check_if: 'Check network interfaces',
              check_pids: 'Check processes IDs',
              check_ports: 'Check network ports',
              check_sys: 'Check anomalous system objects',
              check_trojans: 'Check trojans',
              check_unixaudit: 'Check UNIX audit',
              system_audit: 'UNIX audit files paths',
              enabled: 'Security configuration assessment enabled',
              scan_on_start: 'Scan on start',
              interval: 'Interval',
              policies: 'Policies'
            }
          ],
          tabs: ['General', 'Security configuration assessment']
        },
        {
          subtitle: 'OpenSCAP',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/wodle-openscap.html'),
          desc:
            'Configuration assessment and automation of compliance monitoring using SCAP checks',
          wodle: [{ name: 'open-scap' }],
          labels: [
            {
              content: 'Evaluations',
              disabled: 'OpenSCAP integration disabled',
              'scan-on-start': 'Scan on start',
              interval: 'Interval between scan executions',
              timeout: 'Timeout (in seconds) for scan executions'
            }
          ]
        },
        {
          subtitle: 'CIS-CAT',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/wodle-ciscat.html'),
          desc: 'Configuration assessment using CIS scanner and SCAP checks',
          wodle: [{ name: 'cis-cat' }],
          labels: [
            {
              disabled: 'CIS-CAT integration disabled',
              'scan-on-start': 'Scan on start',
              interval: 'Interval between scan executions',
              java_path: 'Path to Java executable directory',
              ciscat_path: 'Path to CIS-CAT executable directory',
              timeout: 'Timeout (in seconds) for scan executions',
              content: 'Benchmarks'
            }
          ]
        }
      ]
    },
    {
      title: 'System threats and incident response',
      sections: [
        {
          subtitle: 'Osquery',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/wodle-osquery.html'),
          desc:
            'Expose an operating system as a high-performance relational database',
          wodle: [{ name: 'osquery' }],
          labels: [
            {
              disabled: 'Osquery integration disabled',
              run_daemon: 'Auto-run the Osquery daemon',
              add_labels: 'Use defined labels as decorators',
              log_path: 'Path to the Osquery results log file',
              config_path: 'Path to the Osquery configuration file'
            }
          ]
        },
        {
          subtitle: 'Inventory data',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/wodle-syscollector.html'),
          desc:
            'Gather relevant information about the operating system, hardware, networking and packages',
          wodle: [{ name: 'syscollector' }],
          labels: [
            {
              disabled: 'Syscollector integration disabled',
              'scan-on-start': 'Scan on start',
              interval: 'Interval between system scans',
              network: 'Scan network interfaces',
              os: 'Scan operating system info',
              hardware: 'Scan hardware info',
              packages: 'Scan installed packages',
              ports: 'Scan listening network ports',
              ports_all: 'Scan all network ports',
              processes: 'Scan current processes'
            }
          ]
        },
        {
          subtitle: 'Active response',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/active-response.html'),
          desc: 'Active threat addressing by immediate response',
          config: [{ component: 'com', configuration: 'active-response' }],
          labels: [
            {
              disabled: 'Active response disabled',
              ca_store: 'Use the following list of root CA certificates',
              ca_verification: 'Validate WPKs using root CA certificate'
            }
          ]
        },
        {
          subtitle: 'Commands',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/wodle-command.html'),
          desc: 'Configuration options of the Command wodle',
          wodle: [{ name: 'command' }],
          labels: [
            {
              disabled: 'Command disabled',
              run_on_start: 'Run on start',
              ignore_output: 'Ignore command output',
              skip_verification: 'Ignore checksum verification',
              interval: 'Interval between executions',
              tag: 'Command name',
              command: 'Command to execute',
              verify_md5: 'Verify MD5 sum',
              verify_sha1: 'Verify SHA1 sum',
              verify_sha256: 'Verify SHA256 sum'
            }
          ]
        },
        {
          subtitle: 'Docker listener',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/wodle-docker.html'),
          desc:
            'Monitor and collect the activity from Docker containers such as creation, running, starting, stopping or pausing events',
          wodle: [{ name: 'docker-listener' }],
          labels: [
            {
              disabled: 'Docker listener disabled',
              run_on_start:
                'Run the listener immediately when service is started',
              interval: 'Waiting time to rerun the listener in case it fails',
              attempts: 'Number of attempts to execute the listener'
            }
          ]
        }
      ]
    },
    {
      title: 'Log data analysis',
      sections: [
        {
          subtitle: 'Log collection',
          docuLink: webDocumentationLink('user-manual/capabilities/log-data-collection/index.html'),
          desc:
            'Log analysis from text files, Windows events or syslog outputs',
          config: [
            {
              component: 'logcollector',
              configuration: 'localfile',
              filterBy: 'logformat'
            },
            { component: 'logcollector', configuration: 'socket' }
          ],
          labels: [
            {
              logformat: 'Log format',
              log_format: 'Log format',
              alias: 'Command alias',
              ignore_binaries: 'Ignore binaries',
              target: 'Redirect output to this socket',
              frequency: 'Interval between command executions',
              file: 'Log location',
              location: 'Log location',
              socket: 'Output sockets',
              syslog: 'Syslog',
              command: 'Command',
              full_command: 'Full command',
              audit: 'Audit'
            }
          ],
          options: { hideHeader: true }
        },
        {
          subtitle: 'Integrity monitoring',
          docuLink: webDocumentationLink('user-manual/reference/ossec-conf/syscheck.html'),
          desc:
            'Identify changes in content, permissions, ownership, and attributes of files',
          config: [
            { component: 'syscheck', configuration: 'syscheck', matrix: true }
          ],
          tabs: ['General','Who data'],
          labels: [
            {
              disabled: 'Integrity monitoring disabled',
              frequency: 'Interval (in seconds) to run the integrity scan',
              skip_nfs: 'Skip scan on CIFS/NFS mounts',
              scan_on_start: 'Scan on start',
              directories: 'Monitored directories',
              nodiff: 'No diff directories',
              ignore: 'Ignored files and directories',
              restart_audit: 'Restart audit',
              startup_healthcheck: 'Startup healthcheck'
            }
          ],
          opts: {
            realtime: 'RT',
            check_whodata: 'WD',
            report_changes: 'Changes',
            check_md5sum: 'MD5',
            check_sha1sum: 'SHA1',
            check_perm: 'Per.',
            check_size: 'Size',
            check_owner: 'Owner',
            check_group: 'Group',
            check_mtime: 'MT',
            check_inode: 'Inode',
            check_sha256sum: 'SHA256',
            follow_symbolic_link: 'SL'
          }
        }
      ]
    }
  ]
};
