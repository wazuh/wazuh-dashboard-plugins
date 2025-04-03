import datetime
import random
from constants import DATE_FORMAT

class Randomize():
    def date(self):
        start_date = datetime.datetime.now()
        end_date = start_date - datetime.timedelta(days=10)
        random_date = start_date + (end_date - start_date) * random.random()
        return random_date.strftime(DATE_FORMAT)

    def unix_timestamp(self):
        start_time = datetime.datetime(2000, 1, 1)
        end_time = datetime.datetime.now()
        random_time = start_time + datetime.timedelta(
            seconds=random.randint(0, int((end_time - start_time).total_seconds()))
        )
        return int(random_time.timestamp())

    def data_stream():
        data_stream = {"type": random.choice(["Scheduled", "Realtime"])}
        return data_stream

    def random_event():
        return {
            "category": random.choice(["registy_value", "registry_key", "file"]),
            "type": random.choice(["added", "modified", "deleted"])
        }

    def wazuh():
        return {
            "cluster": {
                "name": f"wazuh-cluster-{random.randint(0, 10)}",
                "node": f"wazuh-cluster-node-{random.randint(0, 10)}",
            },
            "schema": {"version": "1.7.0"},
        }

    def agent(host: dict):
        return {
            "id": f"{random.randint(0, 99):03d}",
            "name": f"Agent{random.randint(0, 99)}",
            "version": f"v{random.randint(0, 9)}-stable",
            "host": host,
        }

randomize = Randomize()