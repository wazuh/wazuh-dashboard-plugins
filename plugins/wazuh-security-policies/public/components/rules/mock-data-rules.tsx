export const decoder = [
  {
    id: 1,
    name: 'rule/discovery_kernel_module_enumeration/0',
    provider: 'native',
    status: 'enable',
    metadata: {
      module: 'Linux',
      title: 'System Information Discovery',
      description: 'Detects System Information Discovery commands.',
      compatibility: '',
      versions: [''],
      author: {
        name: 'Wazuh, Inc.',
        date: '2024/09/09',
      },
      references: [
        'https://github.com/redcanaryco/atomic-red-team/blob/f296668303c29d3f4c07e42bdd2b28d8dd6625f9/atomics/T1082/T1082.md',
        'https://github.com/SigmaHQ/sigma/blob/master/rules/linux/auditd/lnx_auditd_system_info_discovery.yml',
      ],
    },
    definitions: {
      excluded_process_parents_name: [
        'mkinitramfs',
        'cryptroot',
        'framebuffer',
        'dracut',
        'jem',
        'thin-provisioning-tools',
        'readykernel',
        'lvm2',
        'vz-start',
        'iscsi',
        'mdadm',
        'ovalprobes',
        'bcache',
        'plymouth',
        'dkms',
        'overlayroot',
        'weak-modules',
        'zfs',
      ],
    },
    check:
      "$event.module == sysmon-linux AND array_contains($event.category, process) AND array_contains($event.type, start) AND (($process.name == lsmod OR $process.name == modinfo) OR ($process.name == kmod AND array_contains($process.args, list)) OR ($process.name == depmod AND array_contains_any($process.args, '--all', '-a'))) AND NOT match_value($process.parent.name, $excluded_process_parents_name)",
    normalize: [
      {
        map: [
          { 'event.risk_score': '47.0' },
          {
            'rule.description':
              'Detects System Information Discovery commands.',
          },
          { 'rule.license': 'Wazuh Inc.' },
          { 'rule.name': 'Enumeration of Kernel Modules' },
          { 'threat.framework': 'MITRE ATT&CK' },
          { 'threat.technique.id': ['T1082'] },
          { 'threat.technique.name': ['System Information Discovery'] },
          {
            'threat.technique.reference': [
              'https://attack.mitre.org/techniques/T1082/',
            ],
          },
          { 'threat.tactic.id': ['TA0005'] },
          { 'threat.tactic.name': ['Discovery'] },
          {
            'threat.tactic.reference': [
              'https://attack.mitre.org/tactics/TA0005/',
            ],
          },
          {
            'wazuh.rules': 'array_append(discovery_kernel_module_enumeration)',
          },
          { 'vulnerability.severity': 'medium' },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'decoder/system-auth/0',
    provider: 'native',
    status: 'disable',
    metadata: {
      module: 'system',
      dataset: 'system-auth',
      title: 'system-auth logs',
      description: 'Decoder for system athenticated action logs.',
      compatibility:
        'This integration was tested with logs from OS like Ubuntu 20.04, Centos 7, and macOS Sierra.',
      versions: ['any'],
      author: {
        name: 'Wazuh Inc.',
        email: 'info@wazuh.com',
        date: '2023/05/15',
      },
      references: [
        'https://www.loggly.com/ultimate-guide/linux-logging-basics/',
      ],
    },
    parents: ['decoder/syslog/0'],
    definitions: {
      isAuthProcess:
        '$process.name == sshd OR $process.name == sudo OR $process.name == groupadd OR $process.name == useradd OR $process.name == groupdel OR $process.name == groupmod OR $process.name == userdel OR $process.name == usermod OR $process.name == CRON',
    },
    check: '$isAuthProcess',
    normalize: [
      {
        map: [
          { 'event.dataset': 'system-auth' },
          { 'event.kind': 'event' },
          { 'event.module': 'system' },
          { 'event.outcome': 'success' },
          { 'wazuh.decoders': 'array_append(system-auth)' },
        ],
      },
      {
        check: [{ 'process.name': 'sshd' }],
        'parse|message': [
          '<_system.auth.ssh.event> <_system.auth.ssh.method> for <user.name> from <source.ip> port <source.port> ssh2(?:<~>)',
          '<_system.auth.ssh.event> user <user.name> from <source.ip>(? port <source.port>)',
          'Did not receive identification string from <source.ip>',
          'subsystem request for <_system.auth.ssh.subsystem> by user <user.name>',
          '<_system.auth.ssh.session.action>: Too many authentication <_system.auth.ssh.event> for <user.name> [preauth]',
          '<user.name> [<~>][<~>]: <_system.auth.ssh.event>: <_system.auth.ssh.session.process_id> tty<~/literal//>?<~/literal/s><_system.process.tty.char_device.major>',
          '<_system.auth.ssh.event>: Read from socket failed: Connection reset by peer [preauth]',
          'Received <_system.auth.ssh.event> from <source.ip>: <~>:  [<~>]',
        ],
      },
      {
        check:
          '$_system.auth.ssh.event == Accepted OR $_system.auth.ssh.event == USER_PROCESS',
        map: [
          { 'event.action': 'ssh_login' },
          { 'event.category': 'array_append(authentication, session)' },
          { 'event.outcome': 'success' },
          { 'event.type': 'array_append(info)' },
        ],
      },
      {
        check:
          '$_system.auth.ssh.event == DEAD_PROCESS OR $_system.auth.ssh.event == disconnect',
        map: [
          { 'event.action': 'ssh_login' },
          { 'event.category': 'array_append(authentication, session)' },
          { 'event.outcome': 'success' },
          { 'event.type': 'array_append(end)' },
        ],
      },
      {
        check:
          '$_system.auth.ssh.event == Invalid OR $_system.auth.ssh.event == Failed OR $_system.auth.ssh.event == failures OR $_system.auth.ssh.event == fatal',
        map: [
          { 'event.action': 'ssh_login' },
          { 'event.category': 'array_append(authentication)' },
          { 'event.outcome': 'failure' },
          { 'event.type': 'array_append(info)' },
        ],
      },
      {
        check: [{ 'process.name': 'sudo' }],
        'parse|message': [
          String.raw`<user.name> : <_system.auth.sudo.error> ; TTY=tty<~/literal/\/>?<~/literal/s><_system.process.tty.char_device.major> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>`,
          '<user.name> : <_system.auth.sudo.error> ; TTY=<_system.auth.sudo.tty> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>',
          '<user.name> : TTY=<_system.auth.sudo.tty> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>',
          String.raw`<user.name> : TTY=tty<~/literal/\/>?<~/literal/s><_system.process.tty.char_device.major> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>`,
        ],
        map: [{ 'event.category': 'array_append(process)' }],
      },
      {
        check: [{ message: 'contains("session opened")' }],
        map: [{ 'event.action': 'logged-on' }],
      },
      {
        check: [{ message: 'contains("session closed")' }],
        map: [{ 'event.action': 'logged-off' }],
      },
      {
        check: [{ message: 'contains(pam_)' }],
        'parse|message': [
          String.raw`pam_unix\(<~>:<~>\): authentication <_system.auth.pam.session.action>; logname=<?_system.auth.pam.foruser.name> uid=<?user.id> euid=<?user.effective.id> tty=<?_system.auth.pam.tty> ruser=<?_system.auth.pam.remote.user> rhost=<?source.ip>  user=<?user.name>`,
        ],
        map: [{ 'event.category': 'array_append(authentication)' }],
      },
      {
        check: [{ message: 'contains(pam_)' }],
        'parse|message': [
          String.raw`pam_unix\(<~>:<~>\): session <_system.auth.pam.session.action> for user <_system.auth.pam.foruser.name> by <_system.auth.pam.byuser.name>\(uid=<user.id>\)`,
          String.raw`pam_unix\(<~>:<~>\): session <_system.auth.pam.session.action> for user <_system.auth.pam.foruser.name> by \(uid=<user.id>\)`,
          String.raw`pam_unix\(<~>:<~>\): session <_system.auth.pam.session.action> for user <_system.auth.pam.foruser.name>`,
        ],
        map: [{ 'event.category': 'array_append(session)' }],
      },
      {
        check: [{ message: 'contains(pam_succeed_if)' }],
        'parse|message': [
          String.raw`pam_succeed_if\(<~>:<~>\): requirement <~> not met by user <user.name>`,
        ],
        map: [{ 'event.outcome': 'failure' }],
      },
      {
        check: [{ message: 'contains(PAM)' }],
        'parse|message': [
          'PAM <~> more authentication <_system.auth.pam.session.action>; logname=<?_system.auth.pam.foruser.name> uid=<?user.id> euid=<?user.effective.id> tty=<?_system.auth.pam.tty> ruser=<?_system.auth.pam.remote.user> rhost=<?source.ip> user=<?user.name>',
        ],
        map: [{ 'event.category': 'array_append(authentication, session)' }],
      },
      {
        check: [{ message: 'contains(PAM)' }],
        'parse|message': [
          'error: PAM: <~> authentication <~> user <user.name> from <source.address>',
        ],
      },
      {
        check: [{ '_system.auth.pam.byuser.name': "string_not_equal('')" }],
        map: [
          { 'user.name': '$_system.auth.pam.byuser.name' },
          { 'user.effective.name': '$_system.auth.pam.foruser.name' },
        ],
      },
      {
        check: [{ '_system.auth.pam.byuser.name': 'not_exists()' }],
        map: [{ 'user.name': '$_system.auth.pam.foruser.name' }],
      },
      {
        check: '$_system.auth.pam.session.action == closed',
      },
    ],
  },
  {
    id: 3,
    name: 'decoder/apache-access/0',
    provider: 'native',
    status: 'disable',
    metadata: {
      module: 'apache-http',
      title: 'Apache HTTP Server access logs decoder',
      description: 'Decoder for Apache HTTP Server access logs.',
      versions: ['2.2.31', '2.4.16'],
      compatibility:
        'The Apache datasets were tested with Apache 2.4.12 and 2.4.46 and are expected to work with all versions >= 2.2.31 and >= 2.4.16 (independent from operating system).',
      author: {
        name: 'Wazuh Inc.',
        date: '2023/11/29',
      },
      references: [
        'https://httpd.apache.orgPlease generate document codes/2.4/logs.html',
      ],
    },
    check: '$event.module == apache-access',
    'parse|event.original': [
      '<destination.domain> <source.address> - <user.name> [<event.start/ANSIC>] "<~/literal/->?<_http_request>" <http.response.status_code> <http.response.body.bytes>?<~/literal/-> "<http.request.referrer>" "<user_agent.original>"',
      '<destination.domain> <source.address> - <user.name> [<event.start/HTTPDATE>] "<~/literal/->?<_http_request>" <http.response.status_code> <http.response.body.bytes>?<~/literal/-> "<http.request.referrer>" "<user_agent.original>"',
      '<source.address> - <user.name> [<event.start/HTTPDATE>] "<_http_request>" <http.response.status_code> <_ignore/literal/->?<http.response.body.bytes>(? "<http.request.referrer>" "<user_agent.original>")',
      '<source.address> - <user.name> [<event.start/HTTPDATE>] "-" <http.response.status_code> -',
      '<source.address> - - [<event.start/ANSIC>] "-" <http.response.status_code> -',
      '<source.address> - - [<event.start/ANSIC>] "<~/literal/->?<_http_request>" <http.response.status_code> <http.response.body.bytes>?<~/literal/-> "<http.request.referrer>" "<user_agent.original>"',
      '<source.address> - <user.name> [<event.start/ANSIC>] "<~/literal/->?<_http_request>" <http.response.status_code> <http.response.body.bytes>?<~/literal/-> "<http.request.referrer>" "<user_agent.original>"',
      '[<event.start/ANSIC>] <source.address> <network.protocol> <tls.cipher> "<_http_request>" <http.response.body.bytes>?<~/literal/->',
      '[<event.start/HTTPDATE>] <source.address> <network.protocol> <tls.cipher> "<_http_request>" <http.response.body.bytes>?<~/literal/->',
      '<source.address> - - [<event.start/HTTPDATE>] "<~/literal/->?<_http_request>" <http.response.status_code> <http.response.body.bytes>?<~/literal/-> "<http.request.referrer>" "<user_agent.original>" "-"',
      '<source.address> - <user.name> [<event.start/HTTPDATE>] "<~/literal/->?<_http_request>" <http.response.status_code> <http.response.body.bytes>?<~/literal/-> "<http.request.referrer>" "<user_agent.original>" X-Forwarded-For="<_forwarded_for>"',
    ],
    normalize: [
      {
        map: [
          { 'event.category': 'array_append(web)' },
          { 'event.dataset': 'apache-access' },
          { 'event.kind': 'event' },
          { 'event.module': 'apache-http' },
          { 'service.type': 'apache' },
          { 'wazuh.decoders': 'array_append(apache-access)' },
          { 'source.ip': '$source.address' },
          { _tls: "split($network.protocol, 'v')" },
          { _tls_1: '$_tls.1' },
          { _client_ip: "split($_forwarded_for, ',')" },
          { 'client.ip': '$_client_ip.0' },
          { 'network.forwarded_ip': '$_client_ip.0' },
          { 'tls.version_protocol': '$_tls.0' },
          { 'tls.cipher': '$tls.cipher' },
        ],
        'parse|_http_request': [
          '<http.request.method> <url.original> HTTP/<http.version>',
        ],
      },
      {
        check: [{ _tls_1: String.raw`regex_match(\d+\.\d+)` }],
        map: [{ 'tls.version': '$_tls_1' }],
      },
      {
        check: [{ _tls_1: String.raw`regex_not_match(\d+\.d+)` }],
        map: [{ 'tls.version': "concat_any($_tls_1, '.0')" }],
      },
      {
        check: 'int_less($http.response.status_code, 400)',
        map: [{ 'event.outcome': 'success' }],
      },
      {
        check: 'int_greater_or_equal($http.response.status_code, 400)',
        map: [{ 'event.outcome': 'failure' }],
      },
      {
        check: [{ 'source.ip': 'not_exists()' }],
        map: [{ 'source.domain': 'parse_fqdn($source.address)' }],
      },
      {
        map: [
          {
            'url.extension': String.raw`regex_extract($url.original, '.*\.([a-zA-Z0-9]+)(?:\?|$)')`,
          },
          { 'url.path': '$url.original' },
          { 'url.query': String.raw`regex_extract($url.original, '\?(.*)')` },
          { 'url.domain': '$destination.domain' },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'decoder/syslog/0',
    provider: 'native',
    status: 'disable',
    metadata: {
      module: 'syslog',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      versions: ['4.3'],
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    check: '$event.module == syslog',
    'parse|event.original': [
      // BSD Syslog RFC 3164 standard
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
      // BSD Syslog RFC 3164 no pid
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',
      // BSD Syslog RFC 3164 standard ISO8601
      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',
      // BSD Syslog RFC 3164 no pid ISO8601
      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      // RFC3164 example 2 section 5.4
      '<event.start/SYSLOG> <host.hostname> <message>',
      // RFC3164 example 4 section 5.4
      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
  {
    id: 5,
    name: 'decoder/syslog/1',
    provider: 'native',
    status: 'disable',
    metadata: {
      module: 'syslog5',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    'parse|event.original': [
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',

      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      '<event.start/SYSLOG> <host.hostname> <message>',

      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
  {
    id: 6,
    name: 'check/string',
    provider: 'native',
    status: 'draft',
    metadata: {
      module: 'syslog6',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    check:
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
  {
    id: 7,
    name: 'check/array',
    provider: 'custom',
    status: 'enable',
    metadata: {
      module: 'syslog',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    'parse|event.original': [
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',

      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      '<event.start/SYSLOG> <host.hostname> <message>',

      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    check: [
      { 'event.kind': 'event' },
      { 'wazuh.decoders': 'array_append(syslog)' },
      { 'related.hosts': 'array_append($host.hostname)' },
      { 'process.name': 'rename($TAG)' },
      { 'host.ip': 'array_append($tmp.host_ip)' },
    ],
  },
  {
    id: 8,
    name: 'decoder/syslog/1',
    provider: 'custom',
    status: 'enable',
    metadata: {
      module: 'syslog',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    'parse|event.original': [
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',

      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      '<event.start/SYSLOG> <host.hostname> <message>',

      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
  {
    id: 9,
    name: 'decoder/syslog/2',
    provider: 'custom',
    status: 'enable',
    metadata: {
      module: 'syslog',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    'parse|event.original': [
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',

      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      '<event.start/SYSLOG> <host.hostname> <message>',

      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
  {
    id: 10,
    name: 'decoder/syslog/0',
    provider: 'custom',
    status: 'draft',
    metadata: {
      module: 'syslog',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    'parse|event.original': [
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',

      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      '<event.start/SYSLOG> <host.hostname> <message>',

      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
  {
    id: 11,
    name: 'decoder/syslog/1',
    provider: 'custom',
    status: 'draft',
    metadata: {
      module: 'syslog',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    'parse|event.original': [
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',

      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      '<event.start/SYSLOG> <host.hostname> <message>',

      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
  {
    id: 12,
    name: 'decoder/syslog/2',
    provider: 'custom',
    status: 'draft',
    metadata: {
      module: 'syslog',
      title: 'Syslog Decoder event',
      description: 'Syslog header',
      compatibility: 'This decoder has been tested on Wazuh version 4.3',
      author: {
        name: 'Wazuh, Inc.',
        url: 'https://wazuh.com',
        date: '2022/11/08',
      },
      references: [
        'https://www.ietf.org/rfc/rfc3164.txt',
        'https://www.ietf.org/rfc/rfc5424.txt',
      ],
    },
    'parse|event.original': [
      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',

      '<event.start/Jun 14 15:16:01> <host.hostname> <TAG/alphanumeric/->:<~/ignore/ ><message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->[<process.pid>]: <message>',

      '<event.start/2018-08-14T14:30:02.203151+02:00> <host.hostname> <TAG/alphanumeric/->: <message>',
      '<event.start/SYSLOG> <host.hostname> <message>',

      '<event.start/%Y %b %d %T> <timezone> <host.hostname> <tmp.host_ip> <TAG/alphanumeric/->[<process.pid>]:<~/ignore/ ><message>',
    ],
    normalize: [
      {
        map: [
          { 'event.kind': 'event' },
          { 'wazuh.decoders': 'array_append(syslog)' },
          { 'related.hosts': 'array_append($host.hostname)' },
          { 'process.name': 'rename($TAG)' },
          { 'host.ip': 'array_append($tmp.host_ip)' },
        ],
      },
    ],
  },
];
