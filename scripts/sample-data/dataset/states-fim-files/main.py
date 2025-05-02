import random
from lib.randomize import randomize
from lib.constants import DEFAULT_COUNT
from lib.generate import generate

default_count=DEFAULT_COUNT
default_index_name=generate.index_name('fim-files')

def generate_random_file():
    return {
        "gid": f"gid{random.randint(0, 1000)}",
        "group": f"group{random.randint(0, 1000)}",
        "hash": {
            "md5": f"{random.randint(0, 9999)}",
            "sha1": f"{random.randint(0, 9999)}",
            "sha256": f"{random.randint(0, 9999)}",
        },
        "inode": f"inode{random.randint(0, 1000)}",
        "mtime": randomize.date(),
        "owner": f"owner{random.randint(0, 1000)}",
        "path": random.choice([
          # same path the UI sample data generator related to alerts, so the alerts and inventory
          # data match in the paths that is required for some features
          "/etc/resolv.conf",
          "/var/wazuh/queue/fim/db/fim.db-journal",
          "/var/wazuh/queue/fim/db/fim.db",
          "/var/osquery/osquery.db/CURRENT",
          "/etc/sysconfig/network-scripts/ifcfg-eth1",
          "/etc/filebeat/fields.yml",
          "/var/log/lastlog",
          "/tmp/agent.conf",
          "/etc/elasticsearch/elasticsearch.yml",
          "/etc/elasticsearch/users",
          "/etc/elasticsearch/config",
          "/tmp/wazuh-config",
          "/run/utmp",
          "/etc/resolv.conf",
          "/var/wazuh/queue/fim/db/fim.db",
          "/var/osquery/osquery.db/CURRENT",
          "/run/utmp",
        ]),
        "size": random.randint(1000, 1000000),
        "uid": f"uid{random.randint(0, 1000)}",
    }

def generate_document(params):
    # https://github.com/wazuh/wazuh-indexer/pull/744

    return generate.document({
        "data_stream": randomize.data_stream(),
        "event": randomize.event(),
        "file": generate_random_file(),
    })

