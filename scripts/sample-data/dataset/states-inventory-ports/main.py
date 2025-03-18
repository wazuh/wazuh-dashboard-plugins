import random
import datetime

default_count='10000'
default_index_name_prefix='wazuh-states-inventory-ports'
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
    agent = {
        'id': agent_id,
        'name': f'Agent{agent_id}',
        'version': f'v{random.randint(0, 9)}-stable',
        'host': generate_random_host()
    }
    return agent


def generate_random_host(is_root_level=False):
    if is_root_level:
        return {
            "network": {
                "egress": {"queue": random.randint(0, 1000)},
                "ingress": {"queue": random.randint(0, 1000)},
            }
        }
    else:
        return {
            "architecture": random.choice(["x86_64", "arm64"]),
            "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        }


def generate_random_destination():
    return {
        "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "port": random.randint(0, 65535),
    }


def generate_random_device():
    return {"id": f"device{random.randint(0, 9999)}"}


def generate_random_file():
    return {"inode": f"inode{random.randint(0, 9999)}"}


def generate_random_process():
    return {
        "name": f"process{random.randint(0, 9999)}",
        "pid": random.randint(0, 99999),
    }


def generate_random_source():
    return {
        "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "port": random.randint(0, 65535),
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
      "destination": generate_random_destination(),
      "device": generate_random_device(),
      "file": generate_random_file(),
      "host": generate_random_host(True),
      "interface": {"state": random.choice(["LISTEN", "ESTABLISHED"])},
      "network": {"transport": random.choice(["TCP", "UDP", "ICMP"])},
      "process": generate_random_process(),
      "source": generate_random_source(),
      "operation": generate_random_operation(),
      "wazuh": generate_random_wazuh(),
  }

