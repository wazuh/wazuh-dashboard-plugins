import random
from lib.randomize import randomize

default_count='10000'
default_index_name_prefix='wazuh-states-inventory-hardware'
default_index_name=f'{default_index_name_prefix}-sample'

def generate_random_agent():
    return {
        "id": f"{random.randint(0, 99):03d}",
        "name": f"Agent{random.randint(0, 99)}",
        "version": f"v{random.randint(0, 9)}-stable",
        "host": generate_random_host(False),
    }


def generate_random_host(is_root_level=False):
    if is_root_level:
        return {
            "cpu": {
                "cores": random.randint(1, 16),
                "name": f"CPU{random.randint(1, 999)}",
                "speed": random.randint(1000, 5000),
            },
            "memory": {
                "free": random.randint(1000, 100000),
                "total": random.randint(1000, 100000),
                "used": random.randint(0, 100),
            },
        }
    else:
        return {
            "architecture": random.choice(["x86_64", "arm64"]),
            "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        }


def generate_random_observer():
    return {"serial_number": f"serial{random.randint(0, 9999)}"}


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
      "host": generate_random_host(True),
      "observer": generate_random_observer(),
      "wazuh": generate_random_wazuh(),
  }


