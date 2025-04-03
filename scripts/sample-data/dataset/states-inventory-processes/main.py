import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-processes')

def generate_random_process():
    return {
        "args": f"arg{random.randint(0, 9999)}",
        "command_line": f"command{random.randint(0, 9999)}",
        "name": f"process{random.randint(0, 9999)}",
        "parent": {"pid": random.randint(1, 9999)},
        "pid": random.randint(1, 9999),
        "state": random.choice(
            [
                "Running",
                "Uninterruptible Sleep",
                "Interruptable Sleep",
                "Stopped",
                "Zombie",
            ]
        ),
        "stime": randomize.unix_timestamp(),
        "utime": randomize.unix_timestamp(),
    }

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "process": generate_random_process(),
    })
