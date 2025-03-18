import random
import datetime

default_count='10000'
default_index_name_prefix='wazuh-states-inventory-packages'
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


def generate_random_host():
    host = {
        'architecture': random.choice(['x86_64', 'arm64']),
        'ip': generate_random_ip(),
    }
    return host


def generate_random_agent():
    agent_id = f'{random.randint(0, 99):03d}'
    agent = {
        'id': agent_id,
        'name': f'Agent{agent_id}',
        'version': f'v{random.randint(0, 9)}-stable',
        'host': generate_random_host()
    }
    return agent


def generate_random_package():
  package_name = f'package_{random.randint(1, 255)}'
  return {
      "architecture": random.choice(["x86_64", "arm64"]),
      "description": f"description{random.randint(0, 9999)}",
      "groups": f"group{random.randint(1, 100)}",
      "installed": generate_random_date(),
      "name": f"package{random.randint(0, 9999)}",
      "path": f"/path/to/package{random.randint(0, 9999)}",
      "vendor": random.choice(["Microsoft", "Canonical", "Apple", "RedHat"]),
      "version": f"{random.randint(0, 9)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
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
      "package": generate_random_package(),
      "operation": generate_random_operation(),
      "wazuh": generate_random_wazuh(),
  }

