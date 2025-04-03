import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-hardware')

def generate_random_agent():
    return randomize.agent(host=generate_random_host(False))

def generate_random_host(is_root_level=False):
    if is_root_level:
        return {
            "cpu": {
                "cores": random.randint(1, 16),
                "name": f"CPU{random.randint(1, 999)}",
                "speed": random.randint(1000, 5000),
            },
            "memory": {
                "free": random.randint(1000, 100000),
                "total": random.randint(1000, 100000),
                "used": random.randint(0, 100),
            },
        }
    else:
        return {
            "architecture": random.choice(["x86_64", "arm64"]),
            "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        }


def generate_random_observer():
    return {"serial_number": f"serial{random.randint(0, 9999)}"}

def generate_document(params):
  # https://github.com/wazuh/wazuh-indexer/pull/744

  return {
      "@timestamp": randomize.date(),
      "agent": generate_random_agent(),
      "host": generate_random_host(True),
      "observer": generate_random_observer(),
      "wazuh": randomize.wazuh(),
  }


