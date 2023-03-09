# pylint: disable=missing-function-docstring,missing-class-docstring
import os
import platform
import logger_manager as log

_LOGGER = log.setup_logging("monitored_file")
is_windows = platform.system().lower() == "windows"
if is_windows:
    import win32file
    import msvcrt
    import win32api

class MonitoredFile:
    RETRIES_FOR_LINEBREAK = 100
    def __init__(self, fname):
        self.fname = fname
        self.file = None
        self.uid = None
        self._set_file_attr()
        self.file.seek(0, os.SEEK_END)
        self.missing_linebreaks = 0

    def _get_read_handle(self, filename):
        try:
            if os.path.isdir(filename):
                dwFlagsAndAttributes = win32file.FILE_FLAG_BACKUP_SEMANTICS # pylint: disable=invalid-name
            else:
                dwFlagsAndAttributes = 0 # pylint: disable=invalid-name
            return win32file.CreateFile(
                filename,
                win32file.GENERIC_READ,
                win32file.FILE_SHARE_DELETE |
                win32file.FILE_SHARE_READ |
                win32file.FILE_SHARE_WRITE,
                None,
                win32file.OPEN_EXISTING,
                dwFlagsAndAttributes,
                None
            )
        except win32api.error as e:
            raise IOError() from e

    def _set_file_attr(self):
        if is_windows:
            handle = self._get_read_handle(self.fname)
            self.uid = self._get_unique_id(handle)
            fd = msvcrt.open_osfhandle(handle.Detach(), os.O_RDONLY)
            self.file = os.fdopen(fd, 'r')
        else:
            self.file = open(self.fname) # pylint: disable=consider-using-with
            statinfo = os.fstat(self.file.fileno())
            self.uid = statinfo.st_ino

    def _get_unique_id(self, handle):
        if is_windows:
            (
                _attributes,
                _created_at, _accessed_at, _written_at,
                volume,
                _file_hi, _file_lo,
                _n_links,
                index_hi, index_lo
            ) = win32file.GetFileInformationByHandle(handle)
            return volume, index_hi, index_lo
        return None, None, None

    def close(self):
        if self.file is not None and not self.file.closed:
            self.file.close()

    def __enter__(self):
        return self

    def __exit__(self, exception_type, exception_value, traceback):
        self.close()

    def __del__(self):
        self.close()

    def readline(self):
        prev = self.file.tell()
        line = self.file.readline()
        if line.endswith("\n"):
            self.missing_linebreaks = 0
            return line

        if line: # non-empty line ending without a linebreak could be a line caught mid-write
            if self.missing_linebreaks >= self.__class__.RETRIES_FOR_LINEBREAK:
                self.missing_linebreaks = 0
                return line # if this is the RETRIES_FOR_LINEBREAKth attempt, accept this line had no linebreak and return it
            self.missing_linebreaks += 1
            self.file.seek(prev) # otherwise rewind so we can retry next time
            return ""

        # looks like we may have really reached EOF
        # try to load the next file, but don't read -- there's too much logic
        # above and who knows how deep recursing could take us!
        # let the caller try again later
        with MonitoredFile(self.fname) as other:
            if other.uid != self.uid:
                self.uid, other.uid = other.uid, self.uid
                self.file, other.file = other.file, self.file
                self.file.seek(0, os.SEEK_SET) # rewind, default behavior is to start from tail

        return ""
