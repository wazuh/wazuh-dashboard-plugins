import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('fim-files')

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

def generate_random_operation():
    return {"name": random.choice(["INSERTED", "MODIFIED", "DELETED"])}


def generate_document(params):
  # https://github.com/wazuh/wazuh-indexer/pull/744

  return {
      "@timestamp": randomize.date(),
      "agent": generate_random_agent(),
      "data_stream": randomize.data_stream(),
      "event": randomize.random_event(),
      "file": generate_random_file(),
      "wazuh": randomize.wazuh(),
  }

