import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-packages')

def generate_random_package():
    return {
        "architecture": randomize.architecture(),
        "description": f"description{random.randint(0, 9999)}",
        "category": random.choice(["x11","libs","ssh"]),
        "installed": randomize.date(),
        "name": f"package{random.randint(0, 9999)}",
        "path": f"/path/to/package{random.randint(0, 9999)}",
        "vendor": random.choice(["Microsoft", "Canonical", "Apple", "RedHat"]),
        "version": f"{random.randint(0, 9)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
    }

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "package": generate_random_package(),
    })
