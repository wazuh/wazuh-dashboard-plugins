import random
from lib.randomize import randomize

default_count='10000'
default_index_name_prefix='wazuh-states-inventory-networks'
default_index_name=f'{default_index_name_prefix}-sample'

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
            "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}"
        }
    else:
        return {
            "architecture": random.choice(["x86_64", "arm64"]),
            "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        }


def generate_random_network():
    return {
        "broadcast": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "dhcp": random.choice([True,False]),
        "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "metric": random.randint(1, 100),
        "name":  generate_random_interface(),
        "netmask": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "protocol": random.choice(["TCP", "UDP", "ICMP"]),
    }


def generate_random_interface():
    return f"name{random.randint(0, 9999)}"


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
      "@timestamp": randomize.date(),
      "agent": generate_random_agent(),
      "network": generate_random_network(),
      "wazuh": generate_random_wazuh()
  }

