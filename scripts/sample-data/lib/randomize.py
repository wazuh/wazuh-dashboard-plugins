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

randomize = Randomize()