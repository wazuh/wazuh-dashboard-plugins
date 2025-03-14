import random
import sys
import os.path
import json
from opensearchpy import helpers
from pathlib import Path
import datetime

index_template_file='template.json'
default_count='10000'
default_index_name_prefix='wazuh-states-inventory-interfaces'
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
        "host": generate_random_host(False),
    }

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
        }
    else:
        return {
            "architecture": random.choice(["x86_64", "arm64"]),
            "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        }

def generate_random_network():
    return {"type": random.choice(["wired", "wireless"])}


def generate_random_interface(is_root_level=False):
    return {
        "alias": f"alias{random.randint(0, 9999)}",
        "id": f"eth{random.randint(0, 99)}",
        "mtu": f"{random.randint(1000000, 99999999)}",
        "name": f"name{random.randint(0, 9999)}",
        "state": random.choice(["Active", "Inactive", "Unknown"]),
        "type": random.choice(["wireless", "ethernet"]),
    }

def generate_random_observer():
    return {"ingress": {"interface": generate_random_interface(False)}}


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
      "network": generate_random_network(),
      "observer": generate_random_observer(),
      "operation": generate_random_operation(),
      "wazuh": generate_random_wazuh(),
  }

def generate_documents(params):
  for i in range(0, int(params["count"])):
    yield generate_document({"id": i})

def get_params(ctx):
  count = ''
  while not count.isdigit():
    count = input_question(f'How many documents do you want to generate? [default={default_count}]', {"default_value": default_count})

  index_name = input_question(f'Enter the index name [default={default_index_name}]', {"default_value": default_index_name})

  return {
    "count": count,
    "index_name": index_name
  }

def input_question(message, options = {}):
  response = input(message)

  if(options["default_value"] and response == ''):
    response = options["default_value"]

  return response


def main(ctx):
  setup_dataset_index_index_pattern(ctx,
    template_file=os.path.join(Path(__file__).parent, index_template_file),
    generate_document=generate_document,
    default_index_name=default_index_name,
    default_count=default_count
  )

