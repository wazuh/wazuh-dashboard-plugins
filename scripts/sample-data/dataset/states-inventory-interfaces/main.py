import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-interfaces')

def generate_random_agent():
    return randomize.agent(host=generate_random_host(False))

def generate_mac_address():
    mac = [random.randint(0x00, 0xFF) for _ in range(6)]
    return ':'.join(f'{octet:02x}' for octet in mac)

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
            "mac": generate_mac_address()
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

def generate_document(params):
  # https://github.com/wazuh/wazuh-indexer/pull/744

  return {
      "@timestamp": randomize.date(),
      "agent": generate_random_agent(),
      "host": generate_random_host(True),
      "observer": generate_random_observer(),
      "wazuh": randomize.wazuh(),
  }

