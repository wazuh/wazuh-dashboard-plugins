import random
import datetime

default_count='10000'
default_index_name_prefix='wazuh-states-inventory-interfaces'
default_index_name=f'{default_index_name_prefix}-sample'
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"

def generate_random_date():
    start_date = datetime.datetime.now()
    end_date = start_date - datetime.timedelta(days=10)
    random_date = start_date + (end_date - start_date) * random.random()
    return random_date.strftime(DATE_FORMAT)


def generate_random_agent():
    return {
        "id": f"{random.randint(0, 99):03d}",
        "name": f"Agent{random.randint(0, 99)}",
        "version": f"v{random.randint(0, 9)}-stable",
        "host": generate_random_host(False),
    }


def generate_random_host(is_root_level_level=False):
    if is_root_level_level:
        return {
            "network": {
                "egress": {
                    "bytes": random.randint(1000, 1000000),
                    "drops": random.randint(0, 100),
                    "errors": random.randint(0, 100),
                    "packets": random.randint(100, 10000),
                },
                "ingress": {
                    "bytes": random.randint(1000, 1000000),
                    "drops": random.randint(0, 100),
                    "errors": random.randint(0, 100),
                    "packets": random.randint(100, 10000),
                },
            },
        }
    else:
        return {
            "architecture": random.choice(["x86_64", "arm64"]),
            "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        }


def generate_random_interface(is_root_level=False):
    return {
        "alias": f"alias{random.randint(0, 9999)}",
        "mtu": f"{random.randint(1000000, 99999999)}",
        "name": f"name{random.randint(0, 9999)}",
        "state": random.choice(["Active", "Inactive", "Unknown"]),
        "type": random.choice(["wireless", "ethernet"]),
    }


def generate_random_observer():
    return {"ingress": {"interface": generate_random_interface(False)}}

def generate_random_wazuh():
    return {
        "cluster": {
            "name": f"wazuh-cluster-{random.randint(0, 10)}",
            "node": f"wazuh-cluster-node-{random.randint(0, 10)}",
        },
        "schema": {"version": "1.7.0"},
    }

def generate_document(params):
  # https://github.com/wazuh/wazuh-indexer/pull/744

  return {
      "@timestamp": generate_random_date(),
      "agent": generate_random_agent(),
      "host": generate_random_host(True),
      "observer": generate_random_observer(),
      "wazuh": generate_random_wazuh(),
  }

