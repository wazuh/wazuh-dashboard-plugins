from pathlib import Path

from typing import Callable
from typing import List
from typing import Optional
from typing import Union

def dirhash(
    dirname: Union[str, Path],
    hashfunc: str='md5',
    excluded_files: Optional[List[str]]=None,
    ignore_hidden: bool=False,
    followlinks: bool=False,
    excluded_extensions: Optional[List[str]]=None
) -> str: ...

def _filehash(filepath: str, hashfunc: Callable) -> str: ...

def _reduce_hash(hashlist: List[str], hashfunc: Callable) -> str: ...

__version__: str