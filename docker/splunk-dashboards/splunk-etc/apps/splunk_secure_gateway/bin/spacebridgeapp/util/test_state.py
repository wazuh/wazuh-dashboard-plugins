"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
_test_state = False


def set_test_state(enable):
    global _test_state
    _test_state = enable


def get_test_state():
    global _test_state
    return _test_state
