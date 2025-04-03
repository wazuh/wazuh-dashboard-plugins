import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-hotfixes')

def generate_random_package():
    return {"hotfix": {"name": f"hotfix{random.randint(0, 9999)}"}}

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "package": generate_random_package(),
    })
