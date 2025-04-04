import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-interfaces')

def generate_random_root_host():
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
        "mac": randomize.mac_address()
    }

def generate_random_interface():
    return {
        "alias": f"alias{random.randint(0, 9999)}",
        "mtu": f"{random.randint(1000000, 99999999)}",
        "name": f"name{random.randint(0, 9999)}",
        "state": random.choice(["Active", "Inactive", "Unknown"]),
        "type": random.choice(["wireless", "ethernet"]),
    }

def generate_random_observer():
    return {"ingress": {"interface": generate_random_interface(False)}}

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "host": generate_random_root_host(),
        "observer": generate_random_observer(),
    })
