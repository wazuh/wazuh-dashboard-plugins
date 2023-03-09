import sys

if sys.version_info < (3, 0):
    from .subprocess_sodium_client import SodiumClient
else:
    from .sharedlib_sodium_client import SodiumClient

from .errors import SodiumOperationError, SodiumProcessError