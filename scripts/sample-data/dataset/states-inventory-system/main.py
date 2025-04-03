import random
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('inventory-system')

def generate_random_root_host():
    return {
        "architecture": random.choice(["x86_64", "arm64"]),
        "hostname": f"host{random.randint(0, 1000)}",
        "os": {
            "build": f"{random.randint(0, 1000)}",
            "codename": random.choice(["Jammy", "Noble", "Ventura"]),
            "distribution": {
                "release": f"{random.randint(1, 20)}.{random.randint(1, 100)}"
            },
            "full": f"{random.choice(['debian', 'ubuntu', 'macos', 'ios', 'android', 'RHEL'])} {random.randint(0, 99)}.{random.randint(0, 99)}",
            "kernel": {
                "name": random.choice(["Linux", "Darwin", "NT"]),
                "release": f"{random.randint(1, 1000)}",
                "version": f"{random.randint(1, 1000)}",
            },
            "major": f"{random.randint(1, 100)}",
            "minor": f"{random.randint(1, 100)}",
            "name": random.choice(["Linux", "Windows", "macOS"]),
            "patch": f"{random.randint(1, 100)}",
            "platform": random.choice(["platform1", "platform2"]),
            "version": f"{random.randint(0, 9)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
        },
    }

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "host": generate_random_root_host(),
    })
