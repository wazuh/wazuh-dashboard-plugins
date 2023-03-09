import os
import sys
import json
import time
import splunk_instrumentation.constants as constants
PATH = os.sep.join([os.environ.get('SPLUNK_HOME'), 'var', 'run', 'diags'])


def list_files():
    return [file for file in os.listdir(PATH) if file.endswith('.json')]


def filter_files(jsonList):
    for file in jsonList:
        full_path = PATH + "/" + file
        data = json.load(open(str(full_path)))
        # if over 30 days, delete
        if ((time.time() - data['timeCreated']) >= constants.MAX_DIAG_AGE):
            delete_file(full_path)
    return


def delete_file(path):
    try:
        os.remove(path.split('json')[0] + 'tar.gz')
        os.remove(path)
    finally:
        return


def main():

    try:
        json_files = list_files()
        filter_files(json_files)
    finally:
        return


main()
sys.exit(0)
