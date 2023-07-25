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

import {
  randomElements
} from './common';


export const actorAttributesImage = ["wazuh/wazuh:3.12.0-7.6.1", "docker.elastic.co/elasticsearch/elasticsearch:7.6.2", "docker.elastic.co/kibana/kibana:7.6.2", "nginx:latest"];
export const type = ["container", "image", "volume", "network"];
export const action = ["start", "stop", "pause", "unpause"];
export const actorAttributesName = ["wonderful_page", "nostalgic_gates", "jovial_zuckerberg", "inspiring_jobs", "opening_torvalds", "gifted_bezos", "clever_wales", "laughing_tesla", "kind_nobel"]; // https://github.com/moby/moby/blob/5aa44cdf132788cc0cd28ce2393b44265dd400e9/pkg/namesgenerator/names-generator.go#L600

const stringRandom = 'abcdef0123456789';

export const dataDocker = [{
    rule: {
      level: 3,
      description: "Docker: Network vagrant_default created",
      id: "87930",
      firedtimes: 1,
      mail: false,
      pci_dss: ["10.2.7"],
      groups: ["docker"]
    },
    data: {
      integration: "docker",
      docker: {
        Type: "network",
        Action: "create",
        Actor: {
          ID: randomElements(64, stringRandom),
          Attributes: {
            name: "vagrant_default",
            type: "bridge"
          }
        },
        scope: "local",
        time: "1563354307",
        timeNano: "1563354307459382528.000000"
      }
    }
  },
  {
    rule: {
      level: 3,
      description: "Docker: Image or repository wazuh/wazuh pulled",
      id: "87932",
      firedtimes: 1,
      mail: false,
      groups: ["docker"],
      pci_dss: ["10.2.7"]
    },
    data: {
      integration: "docker",
      docker: {
        status: "pull",
        id: "wazuh/wazuh:3.9.2_7.1.1",
        Type: "image",
        Action: "pull",
        Actor: {
          ID: "wazuh/wazuh:3.9.2_7.1.1",
          Attributes: {
            name: "wazuh/wazuh"
          }
        },
        scope: "local",
        time: "1563354346",
        timeNano: "1563354346181027328.000000"
      }
    }
  },
  {
    rule: {
      firedtimes: 2,
      mail: false,
      level: 5,
      pci_dss: [
        "10.2.7"
      ],
      description: "Docker: Started shell session in container nginx_container",
      groups: [
        "docker"
      ],
      id: "87908",
      nist_800_53: [
        "AU.14"
      ],
      gdpr: [
        "IV_32.2"
      ]
    },
    data: {
      integration: "docker",
      docker: {
        Action: "exec_start: bash ",
        Type: "container",
        Actor: {
          Attributes: {
            image: "nginx",
            name: "nginx_container",
            maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>",
            execID: randomElements(64, stringRandom),
          },
          ID: randomElements(64, stringRandom),
        },
        timeNano: "1587404196804128000.000000",
        from: "nginx",
        time: "1587404196",
        status: "exec_start: bash "
      }
    }
  },
  {
    rule: {
      level: 3,
      description: "Docker: Error message",
      id: "86003",
      firedtimes: 1,
      mail: false,
      groups: ["docker", "docker-error"]
    },
    data: {
      docker: {
        level: "error",
        message: "Not continuing with pull after error: context canceled"
      }
    }
  },
  {
    rule: {
      level: 3,
      description: "Docker: Image or repository wazuh/wazuh-elasticsearch pulled",
      id: "87932",
      firedtimes: 2,
      mail: false,
      groups: ["docker"],
      pci_dss: ["10.2.7"]
    },
    data: {
      integration: "docker",
      docker: {
        status: "pull",
        id: "wazuh/wazuh-elasticsearch:3.9.2_7.1.1",
        Type: "image",
        Action: "pull",
        Actor: {
          ID: "wazuh/wazuh-elasticsearch:3.9.2_7.1.1",
          Attributes: {
            license: "Elastic License",
            name: "wazuh/wazuh-elasticsearch",
            org: {
              "label-schema": {
                "build-date": "20190305",
                license: "GPLv2",
                name: "elasticsearch",
                "schema-version": "1.0",
                url: "https://www.elastic.co/products/elasticsearch",
                "vcs-url": "https://github.com/elastic/elasticsearch",
                vendor: "Elastic",
                version: "7.1.1"
              }
            }
          }
        },
        scope: "local",
        time: "1563354404",
        timeNano: "1563354404067201536.000000"
      }
    }
  },
  {
    rule: {
      level: 3,
      description: "Docker: Image or repository wazuh/wazuh-kibana pulled",
      id: "87932",
      firedtimes: 3,
      mail: false,
      groups: ["docker"],
      pci_dss: ["10.2.7"]
    },
    data: {
      integration: "docker",
      docker: {
        status: "pull",
        id: "wazuh/wazuh-kibana:3.9.2_7.1.1",
        Type: "image",
        Action: "pull",
        Actor: {
          ID: "wazuh/wazuh-kibana:3.9.2_7.1.1",
          Attributes: {
            license: "Elastic License",
            name: "wazuh/wazuh-kibana",
            org: {
              "label-schema": {
                "build-date": "20190305",
                license: "GPLv2",
                name: "kibana",
                "schema-version": "1.0",
                url: "https://www.elastic.co/products/kibana",
                "vcs-url": "https://github.com/elastic/kibana",
                vendor: "Elastic",
                version: "7.1.1"
              }
            }
          }
        },
        scope: "local",
        time: "1563354404",
        timeNano: "1563354404067201536.000000"
      }
    }
  },
  {
    rule: {
      level: 3,
      description: "Docker: Image or repository wazuh/wazuh-nginx pulled",
      id: "87932",
      firedtimes: 3,
      mail: false,
      groups: ["docker"],
      pci_dss: ["10.2.7"]
    },
    data: {
      integration: "docker",
      docker: {
        status: "pull",
        id: "wazuh/wazuh-nginx:3.9.2_7.1.1",
        Type: "image",
        Action: "pull",
        Actor: {
          ID: "wazuh/wazuh-nginx:3.9.2_7.1.1",
          Attributes: {
            maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>",
            name: "wazuh/wazuh-nginx"
          }
        }
      },
      scope: "local",
      time: "1563354404",
      timeNano: "1563354404067201536.000000"
    }
  },
  {
    rule: {
      firedtimes: 1,
      mail: false,
      level: 3,
      description: "Docker: Network bridge connected",
      groups: [
        "docker"
      ],
      id: "87928"
    },
    data: {
      integration: "docker",
      docker: {
        Action: "connect",
        Type: "network",
        Actor: {
          Attributes: {
            container: randomElements(64, stringRandom),
            name: "bridge",
            type: "bridge"
          },
          ID: randomElements(64, stringRandom),
        },
        scope: "local",
        timeNano: "1587084599776133888.000000",
        time: "1587084599"
      }
    }
  },
  {
    rule: {
      firedtimes: 1,
      mail: false,
      level: 3,
      description: "Docker: Container test_container started",
      groups: [
        "docker"
      ],
      id: "87928"
    },
    data: {
      integration: "docker",
      docker: {
        Action: "start",
        Type: "container",
        Actor: {
          Attributes: {
            image: "nginx",
            name: "test_container",
            maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>"
          },
          ID: randomElements(64, stringRandom),
        },
        scope: "local",
        timeNano: "1587084600046795264.000000",
        from: "nginx",
        time: "1587084600",
        status: "start"
      }
    }
  },
  {
    rule: {
      firedtimes: 1,
      mail: false,
      level: 3,
      description: "Docker: Container test_container received the action: die",
      groups: [
        "docker"
      ],
      id: "87928",
      gdpr: [
        "IV_32.2"
      ]
    },
    data: {
      integration: "docker",
      docker: {
        Action: "die",
        Type: "container",
        Actor: {
          Attributes: {
            image: "nginx",
            name: "test_container",
            exitCode: "0",
            maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>"
          },
          ID: randomElements(64, stringRandom),
        },
        scope: "local",
        timeNano: "1587084648640092672.000000",
        from: "nginx",
        time: "1587084648",
        status: "die"
      }
    }
  },
  {
    rule: {
      firedtimes: 1,
      mail: false,
      level: 4,
      description: "Docker: Network bridge disconnected",
      groups: [
        "docker"
      ],
      id: "87929",
      gdpr: [
        "IV_32.2"
      ]
    },
    data: {
      integration: "docker",
      docker: {
        Action: "disconnect",
        Type: "network",
        Actor: {
          Attributes: {
            container: randomElements(64, stringRandom),
            name: "bridge",
            type: "bridge"
          },
          ID: randomElements(64, stringRandom),
        },
        scope: "local",
        timeNano: "1586460544485358336.000000",
        time: "1586460544"
      }
    }
  },
  {
    rule: {
      firedtimes: 1,
      mail: false,
      level: 7,
      description: "Docker: Container nginx_container received the action: kill",
      groups: [
        "docker"
      ],
      id: "87924",
      gdpr: [
        "IV_32.2"
      ]
    },
    data: {
      integration: "docker",
      docker: {
        Action: "kill",
        Type: "container",
        Actor: {
          Attributes: {
            image: "nginx",
            name: "nginx_container",
            signal: "15",
            maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>"
          },
          ID: randomElements(64, stringRandom),
        },
        scope: "local",
        timeNano: "1586460544324527616.000000",
        from: "nginx",
        time: "1586460544",
        status: "kill"
      }
    }
  },
  {
    rule: {
      firedtimes: 2,
      mail: false,
      level: 3,
      description: "Docker: Container nginx_container stopped",
      groups: [
        "docker"
      ],
      id: "87904",
      gdpr: [
        "IV_32.2"
      ]
    },
    data: {
      integration: "docker",
      docker: {
        Action: "stop",
        Type: "container",
        Actor: {
          Attributes: {
            image: "nginx",
            name: "nginx_container",
            maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>"
          },
          ID: randomElements(64, stringRandom),
        },
        scope: "local",
        timeNano: "1586461541373152000.000000",
        from: "nginx",
        time: "1586461541",
        status: "stop"
      }
    }
  },
  {
    rule: {
      firedtimes: 1,
      mail: false,
      level: 3,
      description: "Docker: Container nginx_container restarted",
      groups: [
        "docker"
      ],
      id: "87909",
      gdpr: [
        "IV_32.2"
      ]
    },
    data: {
      integration: "docker",
      docker: {
        Action: "restart",
        Type: "container",
        Actor: {
          Attributes: {
            image: "nginx",
            name: "nginx_container",
            maintainer: "NGINX Docker Maintainers <docker-maint@nginx.com>"
          },
          ID: randomElements(64, stringRandom),
        },
        scope: "local",
        timeNano: "1586460544801840896.000000",
        from: "nginx",
        time: "1586460544",
        status: "restart"
      }
    }
  },
]
