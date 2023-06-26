/*
 * Wazuh app - Osquery sample alerts
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const dataOsquery = [{
    osquery: {
      calendarTime: new Date(),
      subquery: "osquery_info",
      columns: {
        counter: "43",
        uuid: "EC234A5B-D23B-A7AD-CFF7-BC3F24CC5366",
        version: "3.3.2",
      },
      name: "pack_osquery-monitoring_osquery_info",
      action: "added",
      epoch: "0",
      counter: "1836",
      pack: "osquery-monitoring"
    },
    rule: {
      firedtimes: 2,
      mail: false,
      level: 4,
      description: 'osquery: osquery-monitoring osquery_info: Osquery version is 3.3.2 build on ubuntu xenial'
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "iptables",
      columns: {
        chain: "POSTROUTING",
        filter_name: "nat",
        dst_mask: "0.0.0.0",
        match: "yes",
        src_mask: "255.255.0.0",
        dst_ip: "0.0.0.0",
        packets: "43092",
        target: "MASQUERADE",
        src_ip: "172.17.0.0",
        protocol: "0",
        outiface_mask: "FFFFFFFFFFFFFFFF",
        bytes: "3271628",
        iniface: "all",
        outiface: "docker0",
        policy: "ACCEPT"
      },
      name: "pack_incident-response_iptables",
      action: "added",
      epoch: "0",
      counter: "282",
      pack: "incident-response"
    },
    rule: {
      firedtimes: 17,
      mail: false,
      level: 4,
      description: "osquery: incident-response iptables: Iptable source ip 172.17.0.0 with policy ACCEPT and target MASQUERADE has a packet count of 43092",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "iptables",
      columns: {
        chain: "PREROUTING",
        filter_name: "nat",
        dst_mask: "0.0.0.0",
        match: "yes",
        src_mask: "0.0.0.0",
        dst_ip: "0.0.0.0",
        packets: "34553",
        target: "DOCKER",
        src_ip: "0.0.0.0",
        protocol: "0",
        bytes: "2065050",
        iniface: "all",
        outiface: "all",
        policy: "ACCEPT"
      },
      name: "pack_incident-response_iptables",
      action: "added",
      epoch: "0",
      counter: "282",
      pack: "incident-response"
    },
    rule: {
      firedtimes: 17,
      mail: false,
      level: 4,
      description: "osquery: incident-response iptables: Iptable source ip 0.0.0.0 with policy ACCEPT and target DOCKER has a packet count of 34553",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "schedule",
      columns: {
        average_memory: "0",
        avg_system_time: "0",
        executions: "177",
        output_size: "0",
        name: "pack_ossec-rootkit_zk_rootkit",
        interval: "3600",
        avg_user_time: "0",
        last_executed: "1587482079",
        wall_time: "0"
      },
      name: "pack_osquery-monitoring_schedule",
      action: "added",
      epoch: "0",
      counter: "282",
      pack: "osquery-monitoring"
    },
    rule: {
      firedtimes: 82,
      mail: false,
      level: 4,
      description: "osquery: osquery-monitoring schedule: The pack executed is pack_ossec-rootkit_zk_rootkit and the interval is 3600 ",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "osquery_info",
      columns: {
        watcher: "18596",
        system_time: "86740",
        config_valid: "1",
        pid: "18631",
        counter: "33",
        uuid: "EC234A5B-D23B-A7AD-CFF7-BC3F24CC5366",
        version: "3.3.2",
        config_hash: "8423af1820e09cef21c8ed5594827b13ea8af90d",
        build_platform: "ubuntu",
        start_time: "1586893611",
        extensions: "active",
        instance_id: "29ebc250-4d9d-4420-b46f-127ff9e2437d",
        build_distro: "xenial",
        resident_size: "66664000",
        user_time: "124490"
      },
      name: "pack_osquery-monitoring_osquery_info",
      action: "added",
      epoch: "0",
      counter: "1789",
      pack: "osquery-monitoring"
    },
    rule: {
      firedtimes: 82,
      mail: false,
      level: 4,
      description: "osquery: osquery-monitoring schedule: The pack executed is pack_ossec-rootkit_zk_rootkit and the interval is 3600 ",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "mounts",
      columns: {
        path: "/",
        blocks: "5239803",
        inodes: "10484720",
        flags: "rw,seclabel,relatime,attr2,inode64,noquota",
        inodes_free: "10436261",
        blocks_size: "4096",
        blocks_available: "3940776",
        type: "xfs",
        device: "/dev/xvda2",
        device_alias: "/dev/xvda2",
        blocks_free: "3940776"
      },
      name: "pack_incident-response_mounts",
      action: "added",
      epoch: "0",
      counter: "278",
      pack: "incident-response"
    },
    rule: {
      firedtimes: 82,
      mail: false,
      level: 4,
      description: "osquery: osquery-monitoring schedule: The pack executed is pack_ossec-rootkit_zk_rootkit and the interval is 3600 ",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "iptables",
      columns: {
        memory_free: "156012544",
        memory_free_perc: "0.039271301812363",
        threshold: "10%",
        memory_total: "3972685824"
      },
      name: "low_free_memory",
      action: "added",
      epoch: "0",
      counter: "548",
    },
    rule: {
      firedtimes: 82,
      mail: false,
      level: 4,
      description: "osquery: System memory is under 10%",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "iptables",
      columns: {
        memory_free: "156012544",
        memory_free_perc: "0.039271301812363",
        threshold: "15%",
        memory_total: "3972685824"
      },
      name: "low_free_memory",
      action: "added",
      epoch: "0",
      counter: "548",
    },
    rule: {
      firedtimes: 82,
      mail: false,
      level: 4,
      description: "osquery: System memory is under 15%",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "process_memory",
      columns: {
        inode: "0",
        offset: "0",
        permissions: "r-xp",
        start: "0xffffffffff600000",
        end: "0xffffffffff601000",
        pid: "644",
        device: "00:00",
        pseudo: "1"
      },
      name: "pack_incident-response_process_memory",
      action: "added",
      epoch: "0",
      counter: "12",
    },
    rule: {
      firedtimes: 7621,
      mail: false,
      level: 4,
      description: "osquery: incident-response process_memory: Process 644 [vsyscall] memory start 0xffffffffff600000, memory end 0xffffffffff601000",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "iptables",
      columns: {
        chain: "POSTROUTING",
        filter_name: "nat",
        dst_mask: "0.0.0.0",
        match: "yes",
        src_mask: "255.255.0.0",
        dst_ip: "0.0.0.0",
        packets: "43294",
        target: "MASQUERADE",
        src_ip: "172.17.0.0",
        protocol: "0",
        outiface_mask: "FFFFFFFFFFFFFFFF",
        bytes: "3287370",
        iniface: "all",
        outiface: "docker0",
        policy: "ACCEPT"
      },
      name: "pack_incident-response_iptables",
      action: "added",
      epoch: "0",
      counter: "283",
    },
    rule: {
      firedtimes: 18,
      mail: false,
      level: 4,
      description: "osquery: incident-response iptables: Iptable source ip 172.17.0.0 with policy ACCEPT and target MASQUERADE has a packet count of 43294",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "process_env",
      columns: {
        pid: "26151",
        value: "244",
        key: "GENERATION"
      },
      name: "pack_incident-response_process_env",
      action: "added",
      epoch: "0",
      counter: "11",
    },
    rule: {
      firedtimes: 18,
      mail: false,
      level: 4,
      description: "osquery: incident-response process_env: Process 26151 Environment variable GENERATION value 244",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "device_nodes",
      columns: {
        mode: "0666",
        path: "/dev/ptmx",
        uid: "0",
        atime: "0",
        gid: "5",
        ctime: "1586444340",
        mtime: "1587489592",
        type: "character",
        block_size: "4096"
      },
      name: "pack_hardware-monitoring_device_nodes",
      action: "added",
      epoch: "0",
      counter: "138",
      pack: "hardware-monitoring"
    },
    rule: {
      firedtimes: 6,
      mail: false,
      level: 4,
      description: "osquery: hardware-monitoring device_nodes: Device /dev/ptmx, UID 0, GID 5, type character",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "last",
      columns: {
        tty: "pts/0",
        pid: "25728",
        time: "1587494777",
        type: "8"
      },
      name: "pack_incident-response_last",
      action: "added",
      epoch: "0",
      counter: "1",
      pack: "incident-response"
    },
    rule: {
      firedtimes: 2,
      mail: false,
      level: 4,
      description: "osquery: incident-response last: User  host",
    }
  },
  {
    osquery: {
      calendarTime: new Date(),
      subquery: "open_files",
      columns: {
        path: "/var/osquery/osquery.db/MANIFEST-016679",
        pid: "18631"
      },
      name: "pack_incident-response_open_files",
      action: "added",
      epoch: "0",
      counter: "11",
      pack: "incident-response"
    },
    rule: {
      firedtimes: 2,
      mail: false,
      level: 4,
      description: "osquery: incident-response open_files: Process 18631 has file /var/osquery/osquery.db/MANIFEST-016679 opened",
    }
  },
]
