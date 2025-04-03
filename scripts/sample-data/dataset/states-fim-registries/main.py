import random
import datetime
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('fim-registries')

def generate_random_registry():
    return {
        "data": {
            "hash": {
                "md5": f"{random.randint(0, 9999)}",
                "sha1": f"{random.randint(0, 9999)}",
                "sha256": f"{random.randint(0, 9999)}"
            },
            "type": random.choice(["REG_SZ", "REG_DWORD"]),
        },
        "gid": f"gid{random.randint(0, 1000)}",
        "group": f"group{random.randint(0, 1000)}",
        "hive": "HKLM",
        "key": r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\winword.exe",
        "mtime": randomize.unix_timestamp(),
        "owner": f"owner{random.randint(0, 1000)}",
        "path": "/path/to/file",
        "size": random.randint(1000, 1000000),
        "uid": f"uid{random.randint(0, 1000)}",
        "value": f"registry_value{random.randint(0, 1000)}",
    }

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "data_stream": randomize.data_stream(),
        "event": randomize.event(),
        "registry": generate_random_registry(),
    })
