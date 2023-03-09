import asyncio
import functools
import logging
import os
import json
import platform
import sys
import logging as logger
import time
from typing import Callable, Any, TypeVar, Dict

from assist import constants
from os.path import join

from splunk import rest
from splunk.clilib.bundle_paths import make_splunkhome_path

SPLUNK_HOME = os.path.normpath(os.environ["SPLUNK_HOME"])

T = TypeVar("T")

def get_platform():
    return platform.system().lower()

async def async_call(call: Callable[[], T]) -> T:
    loop = asyncio.get_running_loop()
    f = await loop.run_in_executor(None, call)
    return f


def _etc_leaf():
    return 'etc'

def etc():
    result = None
    if 'SPLUNK_ETC' in os.environ:
        result = os.environ['SPLUNK_ETC']
    else:
        result = join(SPLUNK_HOME, _etc_leaf())
        logger.warn('SPLUNK_ETC is not defined; falling back to %s' % result)
    return os.path.normpath(result)


def make_splunkhome_path_helper(relpath):
    basepath = ''

    etc_with_trailing_sep = os.path.join(_etc_leaf(), '')
    if (relpath == _etc_leaf()) or relpath.startswith(etc_with_trailing_sep):
        # Redirect $SPLUNK_HOME/etc to $SPLUNK_ETC.
        basepath = etc()
        # Remove leading etc (and path separator, if present). Note: when
        # emitting $SPLUNK_ETC exactly, with no additional path parts, we
        # set <relpath> to the empty string.
        relpath = relpath[4:]
    else:
        basepath = SPLUNK_HOME

    fullpath = os.path.normpath(os.path.join(basepath, relpath))

    # Check that we haven't escaped from intended parent directories.
    if os.path.relpath(fullpath, basepath)[0:2] == '..':
        raise ValueError('Illegal escape from parent directory "%s": %s' %
                         (basepath, fullpath))

    return fullpath


_PYTHONPATH_ADJUSTED = False

def append_lib_to_pythonpath():
    global _PYTHONPATH_ADJUSTED
    state = _PYTHONPATH_ADJUSTED
    if not _PYTHONPATH_ADJUSTED:
        sys.path.append(make_splunkhome_path(['etc', 'apps', constants.APP_NAME, 'lib']))
        _PYTHONPATH_ADJUSTED = True
    return state


class SplunkSessionToken(object):
    def __init__(self, session_token):
        self.session_token = session_token

    def __repr__(self):
        return 'Splunk %s' % self.session_token

    def __eq__(self, other):
        return self.session_token == getattr(other, 'session_token', None)

    def __hash__(self):
        return hash(self.session_token)


def epoch_minutes():
    now_seconds = int(time.time())
    now_minutes = int(now_seconds/60)
    return now_minutes

