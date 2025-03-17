import random
import os.path
from pathlib import Path
import datetime
from lib.indexer_dashboard import setup_dataset_index_index_pattern

index_template_file='template.json'
default_count='10000'
default_index_name='wazuh-states-fim-registries-sample'
DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"

def generate_random_host():
    host = {
        'architecture': random.choice(['x86_64', 'arm64']),
        'ip': f'{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}',
    }
    return host

def generate_random_unix_timestamp():
  start_time = datetime.datetime(2000, 1, 1)
  end_time = datetime.datetime.now()
  random_time = start_time + datetime.timedelta(
    seconds=random.randint(0, int((end_time - start_time).total_seconds()))
  )
  return int(random_time.timestamp())

def generate_random_agent():
    agent_id = f'{random.randint(0, 99):03d}'
    agent = {
        'id': agent_id,
        'name': f'Agent{agent_id}',
        'version': f'v{random.randint(0, 9)}-stable',
        'host': generate_random_host()
    }
    return agent

def generate_random_date():
    start_date = datetime.datetime.now()
    end_date = start_date - datetime.timedelta(days=10)
    random_date = start_date + (end_date - start_date) * random.random()
    return random_date.strftime(DATE_FORMAT)


def generate_random_data_stream():
    data_stream = {"type": random.choice(["Scheduled", "Realtime"])}
    return data_stream


def generate_random_event():
    return {
        "action": random.choice(["added", "modified", "deleted"]),
        "category": random.choice(["registy_value", "registry_key", "file"]),
        "type": "event",
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
        "key": "SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\winword.exe",
        "mtime": generate_random_unix_timestamp(),
        "owner": f"owner{random.randint(0, 1000)}",
        "path": "/path/to/file",
        "size": random.randint(1000, 1000000),
        "uid": f"uid{random.randint(0, 1000)}",
        "value": f"registry_value{random.randint(0, 1000)}",
    }


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
      "data_stream": generate_random_data_stream(),
      "event": generate_random_event(),
      "operation": generate_random_operation(),
      "registry": generate_random_registry(),
      "wazuh": generate_random_wazuh(),
  }

def main(ctx):
  setup_dataset_index_index_pattern(ctx,
    template_file=os.path.join(Path(__file__).parent, index_template_file),
    generate_document=generate_document,
    default_index_name=default_index_name,
    default_count=default_count
  )

