from __future__ import print_function
import sys
import splunk.rest as rest
import splunk
import json
import logging
import os

import moncocon


def execute(session_key):
    monco = moncocon.Moncocon(session_key=session_key)
    monco.detect_and_set_distributed_mode(configure_ui=True)

if __name__ == '__main__':
    # set up logger to send message to stderr so it will end up in splunkd.log
    sh = logging.StreamHandler()
    # the following line is to make sure the log event looks the same as any other splunkd.log
    sh.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
    l = logging.getLogger()
    l.setLevel(logging.INFO)
    l.addHandler(sh)

    session_key = sys.stdin.read()

    execute(session_key)
