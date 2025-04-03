import random
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-networks')

def generate_random_network():
    return {
        "broadcast": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "dhcp": random.choice([True,False]),
        "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "metric": random.randint(1, 100),
        "name":  generate_random_interface(),
        "netmask": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
        "protocol": random.choice(["TCP", "UDP", "ICMP"]),
    }

def generate_random_interface():
    return f"name{random.randint(0, 9999)}"

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "network": generate_random_network(),
    })
