import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT

default_count=DEFAULT_COUNT
default_index_name='wazuh-states-fim-files-sample'

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


def generate_random_data_stream():
    data_stream = {"type": random.choice(["Scheduled", "Realtime"])}
    return data_stream


def generate_random_event():
    return {
        "category": random.choice(["registy_value", "registry_key", "file"]),
        "type": random.choice(["added", "modified", "deleted"])
    }


def generate_random_file():
    return {
        "gid": f"gid{random.randint(0, 1000)}",
        "group": f"group{random.randint(0, 1000)}",
        "hash": {
            "md5": f"{random.randint(0, 9999)}",
            "sha1": f"{random.randint(0, 9999)}",
            "sha256": f"{random.randint(0, 9999)}",
        },
        "inode": f"inode{random.randint(0, 1000)}",
        "mtime": randomize.date(),
        "owner": f"owner{random.randint(0, 1000)}",
        "path": "/path/to/file",
        "size": random.randint(1000, 1000000),
        "uid": f"uid{random.randint(0, 1000)}",
    }

def generate_random_wazuh():
    return {
        "cluster": {
            "name": f"wazuh-cluster-{random.randint(0, 10)}",
            "node": f"wazuh-cluster-node-{random.randint(0, 10)}",
        },
        "schema": {"version": "1.7.0"},
    }


def generate_random_operation():
    return {"name": random.choice(["INSERTED", "MODIFIED", "DELETED"])}


def generate_document(params):
  # https://github.com/wazuh/wazuh-indexer/pull/744

  return {
      "@timestamp": randomize.date(),
      "agent": generate_random_agent(),
      "data_stream": generate_random_data_stream(),
      "event": generate_random_event(),
      "file": generate_random_file(),
      "wazuh": generate_random_wazuh(),
  }

