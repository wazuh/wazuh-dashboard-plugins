import random
import os.path
from pathlib import Path
import datetime
from lib.indexer_dashboard import setup_dataset_index_index_pattern

index_template_file='template.json'
default_count='10000'
default_index_name_prefix='wazuh-states-inventory-processes'
default_index_name=f'{default_index_name_prefix}-sample'
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"

def generate_random_ip():
    return f'{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}'

def generate_random_port():
    return random.randint(0,65535)

def generate_random_date():
    start_date = datetime.datetime.now()
    end_date = start_date - datetime.timedelta(days=10)
    random_date = start_date + (end_date - start_date) * random.random()
    return random_date.strftime(DATE_FORMAT)


def generate_random_agent():
    agent_id = f'{random.randint(0, 99):03d}'
    return {
        "id": agent_id,
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


def generate_random_operation():
    return {"name": random.choice(["INSERTED", "MODIFIED", "DELETED"])}


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
      "process": generate_random_process(),
      "operation": generate_random_operation(),
      "wazuh": generate_random_wazuh(),
  }


def main(ctx):
  setup_dataset_index_index_pattern(ctx,
    template_file=os.path.join(Path(__file__).parent, index_template_file),
    generate_document=generate_document,
    default_index_name=default_index_name,
    default_count=default_count
  )


