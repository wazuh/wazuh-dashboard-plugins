import random
import datetime
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('fim-registries')

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

def generate_random_registry():
    return {
        "data": {
            "hash": {
                "md5": f"{random.randint(0, 9999)}",
                "sha1": f"{random.randint(0, 9999)}",
                "sha256": f"{random.randint(0, 9999)}"
            },
            "type": random.choice(["REG_SZ", "REG_DWORD"]),
        },
        "gid": f"gid{random.randint(0, 1000)}",
        "group": f"group{random.randint(0, 1000)}",
        "hive": "HKLM",
        "key": r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\winword.exe",
        "mtime": randomize.unix_timestamp(),
        "owner": f"owner{random.randint(0, 1000)}",
        "path": "/path/to/file",
        "size": random.randint(1000, 1000000),
        "uid": f"uid{random.randint(0, 1000)}",
        "value": f"registry_value{random.randint(0, 1000)}",
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
      "data_stream": randomize.data_stream(),
      "event": randomize.random_event(),
      "registry": generate_random_registry(),
      "wazuh": generate_random_wazuh(),
  }

