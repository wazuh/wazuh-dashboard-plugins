import random
from lib.randomize import randomize

default_count='10000'
default_index_name_prefix='wazuh-states-inventory-packages'
default_index_name=f'{default_index_name_prefix}-sample'

def generate_random_agent():
    return {
        "id": f"{random.randint(0, 99):03d}",
        "name": f"Agent{random.randint(0, 99)}",
        "version": f"v{random.randint(0, 9)}-stable",
        "host": generate_random_host(),
    }


def generate_random_host():
    return {
        "architecture": random.choice(["x86_64", "arm64"]),
        "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
    }


def generate_random_package():
    return {
        "architecture": random.choice(["x86_64", "arm64"]),
        "description": f"description{random.randint(0, 9999)}",
        "category": random.choice(["x11","libs","ssh"]),
        "installed": randomize.date(),
        "name": f"package{random.randint(0, 9999)}",
        "path": f"/path/to/package{random.randint(0, 9999)}",
        "vendor": random.choice(["Microsoft", "Canonical", "Apple", "RedHat"]),
        "version": f"{random.randint(0, 9)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
    }


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
      "package": generate_random_package(),
      "wazuh": generate_random_wazuh(),
  }

