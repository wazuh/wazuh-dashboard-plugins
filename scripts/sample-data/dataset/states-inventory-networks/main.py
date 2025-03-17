import random
import os.path
from pathlib import Path
import datetime
from lib.indexer_dashboard import setup_dataset_index_index_pattern

index_template_file='template.json'
default_count='10000'
default_index_name_prefix='wazuh-states-inventory-networks'
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


def generate_random_agent():
    agent_id = f'{random.randint(0, 99):03d}'
    agent = {
        'id': agent_id,
        'name': f'Agent{agent_id}',
        'version': f'v{random.randint(0, 9)}-stable',
        'host': generate_random_host(False)
    }
    return agent

def generate_random_event():
    return {"id": f"{random.randint(1000, 10000000000)}"}


def generate_random_network():
    return {
        "broadcast": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "dhcp": f"dhcp{random.randint(0, 9999)}",
        "metric": random.randint(1, 100),
        "netmask": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "protocol": random.choice(["TCP", "UDP", "ICMP"]),
    }

def generate_random_interface():
    return {"name": f"name{random.randint(0, 9999)}"}


def generate_random_observer():
    return {"ingress": {"interface": generate_random_interface()}}


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
    "host": generate_random_host(True),
    "event": generate_random_event(),
    "network": generate_random_network(),
    "observer": generate_random_observer(),
    "operation": generate_random_operation(),
    "wazuh": generate_random_wazuh(),
  }

def generate_documents(params):
  for i in range(0, int(params["count"])):
    yield generate_document({"id": i})


def main(ctx):
  setup_dataset_index_index_pattern(ctx,
    template_file=os.path.join(Path(__file__).parent, index_template_file),
    generate_document=generate_document,
    default_index_name=default_index_name,
    default_count=default_count
  )

