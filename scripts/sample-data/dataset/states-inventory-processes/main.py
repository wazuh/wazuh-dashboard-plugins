import random
import datetime
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-processes')

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


def generate_random_process():
    return {
        "args": f"arg{random.randint(0, 9999)}",
        "command_line": f"command{random.randint(0, 9999)}",
        "name": f"process{random.randint(0, 9999)}",
        "parent": {"pid": random.randint(1, 9999)},
        "pid": random.randint(1, 9999),
        "state": random.choice(
            [
                "Running",
                "Uninterruptible Sleep",
                "Interruptable Sleep",
                "Stopped",
                "Zombie",
            ]
        ),
        "stime": generate_random_unix_timestamp(),
        "utime": generate_random_unix_timestamp(),
    }


def generate_random_unix_timestamp():
    start_time = datetime.datetime(2000, 1, 1)
    end_time = datetime.datetime.now()
    random_time = start_time + datetime.timedelta(
        seconds=random.randint(0, int((end_time - start_time).total_seconds()))
    )
    return int(random_time.timestamp())


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
      "process": generate_random_process(),
      "wazuh": generate_random_wazuh(),
  }



