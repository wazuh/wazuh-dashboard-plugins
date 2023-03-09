from enum import Enum


class SdkMode(Enum):
    """
    Enum for supported modes for running the SDK. We can either run in splunk mode or standalone mode.
    """
    SPLUNK = 0
    STANDALONE = 1


