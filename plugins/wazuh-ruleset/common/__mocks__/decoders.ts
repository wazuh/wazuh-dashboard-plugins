export default [
  {
    name: '',
    metadata: {},
  },
  {
    name: 'decoder/system-auth/0',
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
          {
            'event.dataset': 'system-auth',
          },
          {
            'event.kind': 'event',
          },
          {
            'event.module': 'system',
          },
          {
            'event.outcome': 'success',
          },
          {
            'wazuh.decoders': 'array_append(system-auth)',
          },
        ],
      },
      {
        check: [
          {
            'process.name': 'sshd',
          },
        ],
        'parse|message': [
          '<_system.auth.ssh.event> <_system.auth.ssh.method> for <user.name> from <source.ip> port <source.port> ssh2(?:<~>)',
          '<_system.auth.ssh.event> user <user.name> from <source.ip>(? port <source.port>)',
          'Did not receive identification string from <source.ip>',
          'subsystem request for <_system.auth.ssh.subsystem> by user <user.name>',
          '<_system.auth.ssh.session.action>: Too many authentication <_system.auth.ssh.event> for <user.name> [preauth]',
          String.raw`<user.name> [<~>][<~>]: <_system.auth.ssh.event>: <_system.auth.ssh.session.process_id> tty<~/literal/\/>?<~/literal/s><_system.process.tty.char_device.major>`,
          '<_system.auth.ssh.event>: Read from socket failed: Connection reset by peer [preauth]',
          'Received <_system.auth.ssh.event> from <source.ip>: <~>:  [<~>]',
        ],
      },
      {
        check:
          '$_system.auth.ssh.event == Accepted OR $_system.auth.ssh.event == USER_PROCESS',
        map: [
          {
            'event.action': 'ssh_login',
          },
          {
            'event.category': 'array_append(authentication, session)',
          },
          {
            'event.outcome': 'success',
          },
          {
            'event.type': 'array_append(info)',
          },
        ],
      },
      {
        check:
          '$_system.auth.ssh.event == DEAD_PROCESS OR $_system.auth.ssh.event == disconnect',
        map: [
          {
            'event.action': 'ssh_login',
          },
          {
            'event.category': 'array_append(authentication, session)',
          },
          {
            'event.outcome': 'success',
          },
          {
            'event.type': 'array_append(end)',
          },
        ],
      },
      {
        check:
          '$_system.auth.ssh.event == Invalid OR $_system.auth.ssh.event == Failed OR $_system.auth.ssh.event == failures OR $_system.auth.ssh.event == fatal',
        map: [
          {
            'event.action': 'ssh_login',
          },
          {
            'event.category': 'array_append(authentication)',
          },
          {
            'event.outcome': 'failure',
          },
          {
            'event.type': 'array_append(info)',
          },
        ],
      },
      {
        check: [
          {
            'process.name': 'sudo',
          },
        ],
        'parse|message': [
          String.raw`<user.name> : <_system.auth.sudo.error> ; TTY=tty<~/literal/\/>?<~/literal/s><_system.process.tty.char_device.major> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>`,
          '<user.name> : <_system.auth.sudo.error> ; TTY=<_system.auth.sudo.tty> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>',
          '<user.name> : TTY=<_system.auth.sudo.tty> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>',
          String.raw`<user.name> : TTY=tty<~/literal/\/>?<~/literal/s><_system.process.tty.char_device.major> ; PWD=<_system.auth.sudo.pwd> ; USER=<user.effective.name> ; COMMAND=<_system.auth.sudo.command>`,
        ],
        map: [
          {
            'event.category': 'array_append(process)',
          },
        ],
      },
      {
        check: [
          {
            message: 'contains("session opened")',
          },
        ],
        map: [
          {
            'event.action': 'logged-on',
          },
        ],
      },
      {
        check: [
          {
            message: 'contains("session closed")',
          },
        ],
        map: [
          {
            'event.action': 'logged-off',
          },
        ],
      },
      {
        check: [
          {
            message: 'contains(pam_)',
          },
        ],
        'parse|message': [
          String.raw`pam_unix\(<~>:<~>\): authentication <_system.auth.pam.session.action>; logname=<?_system.auth.pam.foruser.name> uid=<?user.id> euid=<?user.effective.id> tty=<?_system.auth.pam.tty> ruser=<?_system.auth.pam.remote.user> rhost=<?source.ip>  user=<?user.name>`,
        ],
        map: [
          {
            'event.category': 'array_append(authentication)',
          },
        ],
      },
      {
        check: [
          {
            message: 'contains(pam_)',
          },
        ],
        'parse|message': [
          String.raw`pam_unix\(<~>:<~>\): session <_system.auth.pam.session.action> for user <_system.auth.pam.foruser.name> by <_system.auth.pam.byuser.name>\(uid=<user.id>\)`,
          String.raw`pam_unix\(<~>:<~>\): session <_system.auth.pam.session.action> for user <_system.auth.pam.foruser.name> by \(uid=<user.id>\)`,
          String.raw`pam_unix\(<~>:<~>\): session <_system.auth.pam.session.action> for user <_system.auth.pam.foruser.name>`,
        ],
        map: [
          {
            'event.category': 'array_append(session)',
          },
        ],
      },
      {
        check: [
          {
            message: 'contains(pam_succeed_if)',
          },
        ],
        'parse|message': [
          String.raw`pam_succeed_if\(<~>:<~>\): requirement <~> not met by user <user.name>`,
        ],
        map: [
          {
            'event.outcome': 'failure',
          },
        ],
      },
      {
        check: [
          {
            message: 'contains(PAM)',
          },
        ],
        'parse|message': [
          'PAM <~> more authentication <_system.auth.pam.session.action>; logname=<?_system.auth.pam.foruser.name> uid=<?user.id> euid=<?user.effective.id> tty=<?_system.auth.pam.tty> ruser=<?_system.auth.pam.remote.user> rhost=<?source.ip> user=<?user.name>',
        ],
        map: [
          {
            'event.category': 'array_append(authentication, session)',
          },
        ],
      },
      {
        check: [
          {
            message: 'contains(PAM)',
          },
        ],
        'parse|message': [
          'error: PAM: <~> authentication <~> user <user.name> from <source.address>',
        ],
      },
      {
        check: [
          {
            '_system.auth.pam.byuser.name': "string_not_equal('')",
          },
        ],
        map: [
          {
            'user.name': '$_system.auth.pam.byuser.name',
          },
          {
            'user.effective.name': '$_system.auth.pam.foruser.name',
          },
        ],
      },
      {
        check: [
          {
            '_system.auth.pam.byuser.name': 'not_exists()',
          },
        ],
        map: [
          {
            'user.name': '$_system.auth.pam.foruser.name',
          },
        ],
      },
      {
        check: '$_system.auth.pam.session.action == closed',
        map: [
          {
            'event.type': 'array_append(end)',
          },
        ],
      },
      {
        check: '$process.name == groupadd OR $process.name == useradd',
        'parse|message': [
          'new group: name=<group.name>, GID=<group.id>',
          'new user: name=<user.name>, UID=<user.id>, GID=<group.id>, home=<_system.auth.useradd.home>, shell=<_system.auth.useradd.shell>(?,<~>)',
          'group added to <file.name>: name=<group.name>(?, GID=<group.id>)',
          "<_system.auth.event.outcome> adding user '<user.name>'(?,<~>)",
        ],
      },
      {
        check: '$process.name == userdel OR $process.name == usermod',
        'parse|message': [
          "<~> user '<user.name>'",
          "<~> user '<user.name>'<~>",
        ],
      },
      {
        check:
          '$_system.auth.event.outcome == failed OR $_system.auth.pam.session.action == failure OR $_system.auth.pam.session.action == failures',
        map: [
          {
            'event.outcome': 'failure',
          },
        ],
      },
      {
        check:
          '$process.name == groupadd OR $process.name == groupdel OR $process.name == groupmod OR $process.name == useradd OR $process.name == userdel OR $process.name == usermod',
        map: [
          {
            'event.category': 'array_append(iam)',
          },
        ],
      },
      {
        check:
          '$process.name == useradd OR $process.name == userdel OR $process.name == usermod',
        map: [
          {
            'event.type': 'array_append(user)',
          },
        ],
      },
      {
        check:
          '$process.name == groupadd OR $process.name == groupdel OR $process.name == groupmod',
        map: [
          {
            'event.type': 'array_append(group)',
          },
        ],
      },
      {
        check: '$process.name == groupadd OR $process.name == useradd',
        map: [
          {
            'event.type': 'array_append(creation)',
          },
        ],
      },
      {
        check: '$process.name == groupdel OR $process.name == userdel',
        map: [
          {
            'event.type': 'array_append(deletion)',
          },
        ],
      },
      {
        check: '$process.name == groupmod OR $process.name == usermod',
        map: [
          {
            'event.type': 'array_append(change)',
          },
        ],
      },
      {
        map: [
          {
            'user.name': "replace(\", '')",
          },
          {
            'user.name': "replace(\"'\", '')",
          },
          {
            'user.effective.name': "replace(\", '')",
          },
          {
            'user.effective.name': "replace(\"'\", '')",
          },
          {
            'source.address': '$source.ip',
          },
          {
            'source.domain': 'parse_fqdn($source.address)',
          },
          {
            'related.user':
              'array_append_any($user.name, $user.effective.name)',
          },
          {
            'related.ip': 'array_append($source.ip)',
          },
          {
            'process.command_line': '$_system.auth.sudo.command',
          },
          {
            'process.tty.char_device.major':
              'parse_long($_system.process.tty.char_device.major)',
          },
          {
            'process.working_directory': '$_system.auth.sudo.pwd',
          },
        ],
      },
    ],
  },
  {
    name: 'decoder/windows-sysmon/0',
    metadata: {
      module: 'Windows Sysmon',
      title: 'Decoder for Windows Sysmon',
      description: 'Decoder for Windows Sysmon events',
      versions: ['10x', '11x', '12x', '13x', '14x', '15x'],
      compatibility:
        'This integration was tested on Windows 10, with sysmon version v15.x but it should support version v10.x onwards\n',
      author: {
        name: 'Wazuh, Inc.',
        date: '2023/10/10',
      },
      references: [
        'https://learn.microsoft.com/es-es/sysinternals/downloads/sysmon',
      ],
    },
    parents: ['decoder/windows-event/0'],
    definitions: {
      idEvent_map: {
        '1': {
          category: ['process'],
          type: ['start'],
          message: 'Process Create',
        },
        '2': {
          category: ['file'],
          type: ['change'],
          message: 'File creation time',
        },
        '3': {
          category: ['network'],
          type: ['start', 'connection', 'protocol'],
          message: 'Network connection detected',
        },
        '4': {
          category: ['process'],
          type: ['change'],
          message: 'Sysmon service state change (cannot be filtered)',
        },
        '5': {
          category: ['process'],
          type: ['end'],
          message: 'Process terminated',
        },
        '6': {
          category: ['driver'],
          type: ['start'],
          message: 'Driver Loaded',
        },
        '7': {
          category: ['process'],
          type: ['change'],
          message: 'Image loaded',
        },
        '8': {
          category: ['process'],
          type: ['change'],
          message: 'CreateRemoteThread detected',
        },
        '9': {
          category: ['process'],
          type: ['access'],
          message: 'RawAccessRead detected',
        },
        '10': {
          category: ['process'],
          type: ['access'],
          message: 'Process accessed',
        },
        '11': {
          category: ['file'],
          type: ['creation'],
          message: 'File created',
        },
        '12': {
          category: ['configuration', 'registry'],
          type: ['change'],
          message: 'Registry object added or deleted',
        },
        '13': {
          category: ['configuration', 'registry'],
          type: ['change'],
          message: 'Registry value set',
        },
        '14': {
          category: ['configuration', 'registry'],
          type: ['change'],
          message: 'Registry object renamed',
        },
        '15': {
          category: ['file'],
          type: ['access'],
          message: 'File stream created',
        },
        '16': {
          category: ['configuration'],
          type: ['change'],
          message: 'Sysmon configuration change (cannot be filtered)',
        },
        '17': {
          category: ['file'],
          type: ['creation'],
          message: 'Named pipe created',
        },
        '18': {
          category: ['file'],
          type: ['access'],
          message: 'Named pipe connected',
        },
        '19': {
          category: ['process'],
          type: ['creation'],
          message: 'WMI filter',
        },
        '20': {
          category: ['process'],
          type: ['creation'],
          message: 'WMI consumer',
        },
        '21': {
          category: ['process'],
          type: ['access'],
          message: 'WMI consumer filter',
        },
        '22': {
          category: ['network'],
          type: ['connection', 'protocol', 'info'],
          message: 'DNS query',
        },
        '23': {
          category: ['file'],
          type: ['deletion'],
          message: 'File Delete archived',
        },
        '24': {
          type: ['change'],
          message: 'New content in the clipboard',
        },
        '25': {
          category: ['process'],
          type: ['change'],
          message: 'Process image change',
        },
        '26': {
          category: ['file'],
          type: ['deletion'],
          message: 'File Delete logged',
        },
        '27': {
          category: ['file'],
          type: ['creation', 'denied'],
          message: 'File Block Executable',
        },
        '28': {
          category: ['file'],
          type: ['deletion', 'denied'],
          message: 'File Block Shredding',
        },
        '255': {
          category: ['process'],
          type: ['error'],
          message: 'File Executable Detected',
        },
      },
    },
    check: [
      {
        'windows.System.Provider.@Name': 'Microsoft-Windows-Sysmon',
      },
    ],
    normalize: [
      {
        map: [
          {
            'wazuh.decoders': 'array_append(windows-sysmon)',
          },
          {
            'event.dataset': 'sysmon',
          },
          {
            'event.kind': 'event',
          },
          {
            _event: 'get_key_in($idEvent_map, $event.code)',
          },
          {
            'event.category': '$_event.category',
          },
          {
            'event.type': '$_event.type',
          },
          {
            message: '$_event.message',
          },
          {
            'event.hash': '$windows.EventData.Hash',
          },
          {
            'related.hash': "split($windows.EventData.Hashes, ',')",
          },
          {
            _hashes_kv: String.raw`parse_key_value($windows.EventData.Hashes, '=', ',','\'','\\')`,
          },
          {
            '_hashes.md5': '$_hashes_kv.MD5',
          },
          {
            '_hashes.sha1': '$_hashes_kv.SHA1',
          },
          {
            '_hashes.sha256': '$_hashes_kv.SHA256',
          },
          {
            'process.entity_id': '$windows.EventData.ProcessGuid',
          },
          {
            'process.pid': 'parse_long($windows.EventData.ProcessId)',
          },
          {
            'process.executable': '$windows.EventData.Image',
          },
          {
            'process.entity_id': '$windows.EventData.SourceProcessGuid',
          },
          {
            'process.entity_id': '$windows.EventData.SourceProcessGUID',
          },
          {
            'process.pid': 'parse_long($windows.EventData.SourceProcessId)',
          },
          {
            'process.thread.id': '$windows.EventData.SourceThreadId',
          },
          {
            'process.executable': '$windows.EventData.SourceImage',
          },
          {
            'process.executable': '$windows.EventData.Destination',
          },
          {
            'process.command_line': '$windows.EventData.CommandLine',
          },
          {
            'process.working_directory': '$windows.EventData.CurrentDirectory',
          },
          {
            'process.parent.entity_id': '$windows.EventData.ParentProcessGuid',
          },
          {
            'process.parent.pid':
              'parse_long($windows.EventData.ParentProcessId)',
          },
          {
            'process.parent.executable': '$windows.EventData.ParentImage',
          },
          {
            'process.parent.command_line':
              '$windows.EventData.ParentCommandLine',
          },
          {
            _file_data: 'parse_file($process.executable)',
          },
          {
            'process.name': '$_file_data.name',
          },
          {
            _file_data: 'parse_file($process.parent.executable)',
          },
          {
            'process.parent.name': '$_file_data.name',
          },
          {
            'process.args': "split($process.command_line, ' ')",
          },
          {
            'process.parent.args': "split($process.parent.command_line, ' ')",
          },
          {
            'file.path': '$windows.EventData.TargetFilename',
          },
          {
            'file.path': '$windows.EventData.Device',
          },
          {
            'file.name': '$windows.EventData.PipeName',
          },
          {
            'file.path': '$windows.EventData.ImageLoaded',
          },
          {
            'file.code_signature.subject_name': '$windows.EventData.Signature',
          },
          {
            'file.code_signature.status': '$windows.EventData.SignatureStatus',
          },
          {
            'file.code_signature.signing_id': '$windows.EventData.Signed',
          },
          {
            _file_data: 'parse_file($file.path)',
          },
          {
            'file.directory': '$_file_data.path',
          },
          {
            'file.extension': '$_file_data.ext',
          },
          {
            'file.name': '$_file_data.name',
          },
          {
            'network.transport': '$windows.EventData.Protocol',
          },
          {
            'network.protocol': '$windows.EventData.DestinationPortName',
          },
          {
            'network.protocol': '$windows.EventData.SourcePortName',
          },
          {
            'source.ip': '$windows.EventData.SourceIp',
          },
          {
            'source.domain': '$windows.EventData.SourceHostname',
          },
          {
            'source.port': '$windows.EventData.SourcePort',
          },
          {
            'destination.ip': '$windows.EventData.DestinationIp',
          },
          {
            'destination.domain': '$windows.EventData.DestinationHostname',
          },
          {
            'destination.port': '$windows.EventData.DestinationPort',
          },
          {
            'dns.question.name': '$windows.EventData.QueryName',
          },
          {
            'user.id': '$windows.System.Security.@UserID',
          },
          {
            _user_parts: String.raw`split($windows.EventData.User, \\)`,
          },
          {
            'user.domain': '$_user_parts.0',
          },
          {
            'user.name': '$_user_parts.1',
          },
          {
            'related.user': 'array_append($user.name)',
          },
          {
            'related.ip': 'array_append($windows.EventData.NewTargetUserName)',
          },
          {
            'sysmon.dns.status': '$windows.EventData.QueryStatus',
          },
          {
            'sysmon.file.archived': '$windows.EventData.Archived',
          },
          {
            'sysmon.file.is_executable': '$windows.EventData.IsExecutable',
          },
        ],
      },
      {
        check: '$file.code_signature.status == Valid',
        map: [
          {
            'file.code_signature.valid': true,
          },
        ],
      },
      {
        check: "$event.code == '255'",
        map: [
          {
            'error.code': '$event.code',
          },
        ],
      },
      {
        check: "$event.code == '25'",
        map: [
          {
            message: '$windows.EventData.Type',
          },
        ],
      },
      {
        check: 'string_not_equal($event.code, "7")',
        map: [
          {
            'process.pe.original_file_name':
              '$windows.EventData.OriginalFileName',
          },
          {
            'process.pe.company': '$windows.EventData.Company',
          },
          {
            'process.pe.description': '$windows.EventData.Description',
          },
          {
            'process.pe.file_version': '$windows.EventData.FileVersion',
          },
          {
            'process.pe.product': '$windows.EventData.Product',
          },
        ],
      },
      {
        check: "$event.code == '7'",
        map: [
          {
            'file.pe.original_file_name': '$windows.EventData.OriginalFileName',
          },
          {
            'file.pe.company': '$windows.EventData.Company',
          },
          {
            'file.pe.description': '$windows.EventData.Description',
          },
          {
            'file.pe.file_version': '$windows.EventData.FileVersion',
          },
          {
            'file.pe.product': '$windows.EventData.Product',
          },
        ],
      },
      {
        check: "$event.code == '22'",
        map: [
          {
            'network.protocol': 'dns',
          },
        ],
      },
      {
        check: '$windows.EventData.SignatureStatus == Valid',
        map: [
          {
            'file.code_signature.valid': true,
          },
        ],
      },
      {
        check: "$windows.EventData.Initiated == 'true'",
        map: [
          {
            'network.direction': 'egress',
          },
        ],
      },
      {
        check: "$windows.EventData.Initiated == 'false'",
        map: [
          {
            'network.direction': 'ingress',
          },
        ],
      },
      {
        check: "$windows.EventData.SourceIsIpv6 == 'true'",
        map: [
          {
            'network.type': 'ipv6',
          },
        ],
      },
      {
        check: "$windows.EventData.SourceIsIpv6 == 'false'",
        map: [
          {
            'network.type': 'ipv4',
          },
        ],
      },
      {
        check:
          "$event.code == '1' OR $event.code == '23' OR $event.code == '24' OR $event.code == '25' OR $event.code == '26'",
        map: [
          {
            'process.hash': '$_hashes',
          },
          {
            'process.pe.imphash': '$_hashes_kv.IMPHASH',
          },
        ],
      },
      {
        check:
          "$event.code == '6' OR $event.code == '7' OR $event.code == '15'",
        map: [
          {
            'file.hash': '$_hashes',
          },
          {
            'file.pe.imphash': '$_hashes_kv.IMPHASH',
          },
        ],
      },
      {
        check:
          "$event.code == '12' OR $event.code == '13' OR $event.code == '14'",
        map: [
          {
            'registry.path': '$windows.EventData.TargetObject',
          },
          {
            '_registry.array': String.raw`split($registry.path, \\)`,
          },
          {
            'registry.hive': '$_registry.array.0',
          },
          {
            '_registry.array.0': 'delete()',
          },
          {
            'registry.key': String.raw`join($_registry.array, \\)`,
          },
          {
            'registry.value': String.raw`regex_extract($registry.path, ^.*\\\\(.*\)$)`,
          },
        ],
      },
      {
        check:
          "($event.code == '12' OR $event.code == '13' OR $event.code == '14') AND starts_with($windows.Event.EventData.Details,QWORD)",
        map: [
          {
            'registry.data.type': 'SZ_QWORD',
          },
        ],
      },
      {
        check:
          "($event.code == '12' OR $event.code == '13' OR $event.code == '14') AND starts_with($windows.EventData.Details,DWORD)",
        map: [
          {
            'registry.data.type': 'SZ_DWORD',
          },
          {
            _value: String.raw`regex_extract($windows.EventData.Details, 'DWORD \\((0x[0-9A-F]{8})\\)')`,
          },
        ],
      },
      {
        check: [
          {
            'windows.EventData.Details': "starts_with('Binary Data')",
          },
        ],
        map: [
          {
            _is_binary_data: true,
          },
        ],
      },
      {
        check:
          "($event.code == '12' OR $event.code == '13' OR $event.code == '14') AND $_is_binary_data == true",
        map: [
          {
            'registry.data.type': 'REG_BINARY',
          },
          {
            'registry.data.strings': '$windows.EventData.Details',
          },
        ],
      },
      {
        map: [
          {
            windows: 'delete()',
          },
        ],
      },
    ],
  },
  {
    name: 'rule/discovery_kernel_module_enumeration/0',
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
      "$event.module == sysmon-linux AND array_contains($event.category, process) AND array_contains($event.type, start) AND (($process.name == lsmod OR $process.name == modinfo)\n    OR ($process.name == kmod AND array_contains($process.args, list))\n    OR ($process.name == depmod AND array_contains_any($process.args, '--all', '-a')\n    ))\nAND NOT match_value($process.parent.name, $excluded_process_parents_name) ",
    normalize: [
      {
        map: [
          {
            'event.risk_score': 47,
          },
          {
            'rule.description':
              'Detects System Information Discovery commands.',
          },
          {
            'rule.license': 'Wazuh Inc.',
          },
          {
            'rule.name': 'Enumeration of Kernel Modules',
          },
          {
            'threat.framework': 'MITRE ATT&CK',
          },
          {
            'threat.technique.id': ['T1082'],
          },
          {
            'threat.technique.name': ['System Information Discovery'],
          },
          {
            'threat.technique.reference': [
              'https://attack.mitre.org/techniques/T1082/',
            ],
          },
          {
            'threat.tactic.id': ['TA0005'],
          },
          {
            'threat.tactic.name': ['Discovery'],
          },
          {
            'threat.tactic.reference': [
              'https://attack.mitre.org/tactics/TA0005/',
            ],
          },
          {
            'wazuh.rules': 'array_append(discovery_kernel_module_enumeration)',
          },
          {
            'vulnerability.severity': 'medium',
          },
        ],
      },
    ],
  },
];
