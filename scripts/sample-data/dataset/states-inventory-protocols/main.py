import random
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-protocols')

def generate_random_network():
    return {
        "dhcp": random.choice([True,False]),
        "gateway": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "metric": random.randint(1, 100),
        "type": random.choice(["wired", "wireless"]),
    }

def generate_random_observer():
    return {"ingress": {"interface": generate_random_interface()}}

def generate_random_interface():
    return {
        "name": f"name{random.randint(0, 9999)}",
    }

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "network": generate_random_network(),
        "observer": generate_random_observer(),
    })
