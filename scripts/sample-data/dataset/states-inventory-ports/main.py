import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-ports')

def generate_random_agent():
    return randomize.agent(host=generate_random_host(False))

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

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document(agent=generate_random_agent(), params={
        "destination": generate_random_destination(),
        "file": generate_random_file(),
        "host": generate_random_host(True),
        "interface": {"state": random.choice(["LISTEN", "ESTABLISHED"])},
        "network": {"transport": random.choice(["TCP", "UDP", "ICMP"])},
        "process": generate_random_process(),
        "source": generate_random_source(),
    })
