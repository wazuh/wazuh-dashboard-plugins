import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-hotfixes')

def generate_random_agent():
    return randomize.agent(host=generate_random_host())

def generate_random_host():
    return {
        "architecture": random.choice(["x86_64", "arm64"]),
        "ip": f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}",
    }


def generate_random_package():
    return {"hotfix": {"name": f"hotfix{random.randint(0, 9999)}"}}

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document(agent=generate_random_agent(), params={
        "package": generate_random_package(),
    })
