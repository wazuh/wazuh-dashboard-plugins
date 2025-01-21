export const decoder = [
  {
    id: 1,
    name: 'decoder/syslog/0',
    provider: 'native',
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
    id: 2,
    name: 'decoder/syslog/1',
    provider: 'native',
    status: 'disable',
    metadata: {
      module: 'syslog2',
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
    id: 3,
    name: 'decoder/syslog/2',
    provider: 'native',
    status: 'disable',
    metadata: {
      module: 'syslog3',
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
    id: 4,
    name: 'decoder/syslog/0',
    provider: 'native',
    status: 'disable',
    metadata: {
      module: 'syslog4',
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
    name: 'decoder/syslog/2',
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
    id: 7,
    name: 'decoder/syslog/0',
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
