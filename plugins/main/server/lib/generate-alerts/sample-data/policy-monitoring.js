/*
 * Wazuh app - Policy monitoring sample alerts
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Policy monitoring
export const title = ["Trojaned version of file detected."];
export const ruleDescription = ["Host-based anomaly detection event (rootcheck).", "System Audit event."];

export const location = 'rootcheck';

export const decoder = {
  name: "rootcheck"
};

export const rootkits = {
  Bash: ['/tmp/mcliZokhb', '/tmp/mclzaKmfa'],
  Adore: ['/dev/.shit/red.tgz', '/usr/lib/libt', '/usr/bin/adore'],
  TRK: ['usr/bin/soucemask','/usr/bin/sourcemask'],
  Volc: ['/usr/lib/volc', '/usr/bin/volc'],
  Ramen: ['/usr/lib/ldlibps.so','/usr/lib/ldliblogin.so', '/tmp/ramen.tgz'],
  Monkit: ['/lib/defs', '/usr/lib/libpikapp.a'],
  RSHA: ['usr/bin/kr4p', 'usr/bin/n3tstat', 'usr/bin/chsh2'],
  Omega: ['/dev/chr'],
  "Rh-Sharpe": ['/usr/bin/.ps', '/bin/.lpstree', '/bin/ldu', '/bin/lkillall'],
  Showtee: ['/usr/lib/.wormie','/usr/lib/.kinetic','/usr/include/addr.h'],
  LDP: ['/dev/.kork', '/bin/.login', '/bin/.ps'],
  Slapper: ['/tmp/.bugtraq','/tmp/.bugtraq.c', '/tmp/.b', '/tmp/httpd', '/tmp/.font-unix/.cinik'],
  Knark: ['/dev/.pizda', '/proc/knark'],
  ZK: ['/usr/share/.zk', 'etc/1ssue.net', 'usr/X11R6/.zk/xfs'],
  Suspicious: ['etc/rc.d/init.d/rc.modules', 'lib/ldd.so', 'usr/bin/ddc', 'usr/bin/ishit', 'lib/.so', 'usr/bin/atm', 'tmp/.cheese', 'dev/srd0', 'dev/hd7', 'usr/man/man3/psid']
};

export const rootkitsData = {
  "data": {
    "title": "Rootkit '{_rootkit_category}' detected by the presence of file '{_rootkit_file}'."
  },
  "rule": {
    "firedtimes": 1,
    "mail": false,
    "level": 7,
    "description": "Host-based anomaly detection event (rootcheck).",
    "groups": ["wazuh","rootcheck"],
    "id": "510",
    "gdpr": ["IV_35.7.d"]
  },
  "full_log": "Rootkit '{_rootkit_category}' detected by the presence of file '{_rootkit_file}'.",
};

export const trojans = [
  {file: '/usr/bin/grep', signature: 'bash|givemer'},
  {file: '/usr/bin/egrep', signature: 'bash|^/bin/sh|file\.h|proc\.h|/dev/|^/bin/.*sh'},
  {file: '/usr/bin/find', signature: 'bash|/dev/[^tnlcs]|/prof|/home/virus|file\.h'},
  {file: '/usr/bin/lsof', signature: '/prof|/dev/[^apcmnfk]|proc\.h|bash|^/bin/sh|/dev/ttyo|/dev/ttyp'},
  {file: '/usr/bin/netstat', signature: 'bash|^/bin/sh|/dev/[^aik]|/prof|grep|addr\.h'},
  {file: '/usr/bin/top', signature: '/dev/[^npi3st%]|proc\.h|/prof/'},
  {file: '/usr/bin/ps', signature: '/dev/ttyo|\.1proc|proc\.h|bash|^/bin/sh'},
  {file: '/usr/bin/tcpdump', signature: 'bash|^/bin/sh|file\.h|proc\.h|/dev/[^bu]|^/bin/.*sh'},
  {file: '/usr/bin/pidof', signature: 'bash|^/bin/sh|file\.h|proc\.h|/dev/[^f]|^/bin/.*sh'},
  {file: '/usr/bin/fuser', signature: 'bash|^/bin/sh|file\.h|proc\.h|/dev/[a-dtz]|^/bin/.*sh'},
  {file: '/usr/bin/w', signature: 'uname -a|proc\.h|bash'},
];

export const trojansData = {
  "rule": {
    "firedtimes": 2,
    "mail": false,
    "level": 7,
    "description": "Host-based anomaly detection event (rootcheck).",
    "groups": ["wazuh","rootcheck"],
    "id": "510",
    "gdpr": ["IV_35.7.d"]
  },
  "full_log": "Trojaned version of file '{data.file}' detected. Signature used: '{_trojan_signature}' (Generic).",
};
