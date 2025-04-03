import datetime
import random
from constants import DATE_FORMAT

class Randomize():
    def date(self):
        start_date = datetime.datetime.now()
        end_date = start_date - datetime.timedelta(days=10)
        random_date = start_date + (end_date - start_date) * random.random()
        return random_date.strftime(DATE_FORMAT)

randomize = Randomize()