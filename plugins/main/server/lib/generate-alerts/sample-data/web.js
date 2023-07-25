/*
 * Wazuh app - Docker sample data
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const Protocols = ['GET'];

export const urls = ['/', '/index.asp', '/remote/login?lang=en', '/index.php?lang=en', '/phpmyadmin2020/index.php?lang=en', '/pma2020/index.php?lang=en', '/administrator/admin/index.php?lang=en', '	/administrator/pma/index.php?lang=en', '/administrator/db/index.php?lang=en', '/db/phpMyAdmin-3/index.php?lang=en',
'/db/myadmin/index.php?lang=en', '/sql/phpMyAdmin/index.php?lang=en', '/sql/phpmyadmin2/index.php?lang=en', '/sql/sqlweb/index.php?lang=en', '/mysql/web/index.php?lang=en', '/wp-content/plugins/portable-phpmyadmin/wp-pma-mod/index.php?lang=en', '/shopdb/index.php?lang=en']


export const userAgents = [ // https://deviceatlas.com/blog/list-of-user-agent-strings
  // Desktop 
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
  'Mozilla/5.0 (X11; CrOS x86_64 8172.45.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.64 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/601.3.9 (KHTML, like Gecko) Version/9.0.2 Safari/601.3.9',
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.111 Safari/537.36',

  // Smartphones
  'Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36' ,
  'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 6P Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.83 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/69.0.3497.105 Mobile/15E148 Safari/605.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A5370a Safari/604.1',

  // Tablets 
  'Mozilla/5.0 (Linux; Android 7.0; Pixel C Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/52.0.2743.98 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 6.0.1; SGP771 Build/32.2.A.0.253; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/52.0.2743.98 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 6.0.1; SHIELD Tablet K1 Build/MRA58K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/55.0.2883.91 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 7.0; SM-T827R4 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.116 Safari/537.36',
  'Mozilla/5.0 (Linux; Android 5.0.2; LG-V410/V41020c Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/34.0.1847.118 Safari/537.36',

  // Mobile browsers
  'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1',
  'Mozilla/5.0 (Linux; U; Android 4.4.2; en-us; SCH-I535 Build/KOT49H) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
  'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 7.0; SM-A310F Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Mobile Safari/537.36 OPR/42.7.2246.114996',
  'Mozilla/5.0 (Android 7.0; Mobile; rv:54.0) Gecko/54.0 Firefox/54.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) FxiOS/7.5b3349 Mobile/14F89 Safari/603.2.4',
  'Mozilla/5.0 (Linux; Android 7.0; SAMSUNG SM-G955U Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/5.4 Chrome/51.0.2704.106 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; U; Android 7.0; en-us; MI 5 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/53.0.2785.146 Mobile Safari/537.36 XiaoMi/MiuiBrowser/9.0.3',

  // Consoles
  'Mozilla/5.0 (Nintendo WiiU) AppleWebKit/536.30 (KHTML, like Gecko) NX/3.0.4.2.12 NintendoBrowser/4.3.1.11264.US',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; XBOX_ONE_ED) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
  'Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Xbox; Xbox One) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Mobile Safari/537.36 Edge/13.10586',
  'Mozilla/5.0 (PlayStation 4 3.11) AppleWebKit/537.73 (KHTML, like Gecko)',
  'Mozilla/5.0 (PlayStation Vita 3.61) AppleWebKit/537.73 (KHTML, like Gecko) Silk/3.2',
  'Mozilla/5.0 (Nintendo 3DS; U; ; en) Version/1.7412.EU'
];

export const data = [
  {
    "rule": {
      "firedtimes": 6,
      "mail": false,
      "level": 5,
      "pci_dss": ["6.5","11.4"],
      "description": "Web server 400 error code.",
      "groups": ["web","accesslog","attack"],
      "id": "31101",
      "nist_800_53": ["SA.11","SI.4"],
      "gdpr": ["IV_35.7.d"]
    },
    "location": "/var/log/httpd/access_log",
    "decoder": {
      "name": "web-accesslog"
    },
    "full_log": "{data.srcip} - - [{_date}] \"{data.protocol} {data.url} HTTP/1.1\" {data.id} 219 \"-\" \"{_user_agent}\"",
  },
  {
    "previous_output": "94.111.43.1 - - [24/Apr/2020:07:34:21 +0000] \"GET /phpmyadmin2019/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:20 +0000] \"GET /phpmyadmin2018/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:20 +0000] \"GET /phpmyadmin2017/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:19 +0000] \"GET /phpmyadmin2016/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:19 +0000] \"GET /phpmyadmin2015/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:19 +0000] \"GET /phpmyadmin2014/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:19 +0000] \"GET /phpmyadmin2013/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:18 +0000] \"GET /phpmyadmin2012/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:18 +0000] \"GET /phpmyadmin2011/index.php?lang=en HTTP/1.1\" 404 222 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:17 +0000] \"GET /pma2020/index.php?lang=en HTTP/1.1\" 404 215 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"\n94.111.43.1 - - [24/Apr/2020:07:34:17 +0000] \"GET /pma2019/index.php?lang=en HTTP/1.1\" 404 215 \"-\" \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36\"",
    // "data": {
    //   "protocol": "GET",
    //   "srcip": "94.111.43.1",
    //   "id": "404",
    //   "url": "/phpmyadmin2020/index.php?lang=en"
    // },
    "rule": {
      "firedtimes": 8,
      "mail": false,
      "level": 10,
      "pci_dss": ["6.5","11.4"],
      "description": "Multiple web server 400 error codes from same source ip.",
      "groups": ["web","accesslog","web_scan","recon"],
      "id": "31151",
      "nist_800_53": ["SA.11","SI.4"],
      "frequency": 14,
      "gdpr": ["IV_35.7.d"]
    },
    "decoder": {
      "name": "web-accesslog"
    },
    "full_log": "{data.srcip} - - [{_date}] \"{data.protocol} {data.url} HTTP/1.1\" {data.id} 222 \"-\" \"{_user_agent}\"",
    "location": "/var/log/httpd/access_log",
  }
]