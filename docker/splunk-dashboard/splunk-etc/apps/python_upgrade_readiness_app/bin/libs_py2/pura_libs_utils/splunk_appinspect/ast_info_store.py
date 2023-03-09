import logging
import os.path

from . import utilities

logger = logging.getLogger()


class AstInfoStore(object):
    def __init__(self, libs=None):
        self._data = {}
        self._pointer = None
        self._libs = libs

    def set_pointer(self, position):
        self._pointer = position

    def get_pkg_path_and_obj_name(self, import_chain):
        assert self._pointer
        if import_chain.startswith("."):
            # Relative importing doesn't consider persistent libs
            import_chain_proced, pointer = utilities.relative_import_dump(
                import_chain, self._pointer
            )
            return self._get_pkg_path_and_obj_name_helper(import_chain_proced, pointer)
        return self._get_pkg_path_and_obj_name_helper(
            import_chain, self._pointer, libs=self._libs
        )

    @staticmethod
    def _get_pkg_path_and_obj_name_helper(import_chain_proced, pointer, libs=None):
        if import_chain_proced == "*":
            if pointer.endswith(".py"):
                pointer = os.path.dirname(pointer)
            pkg_path = os.path.join(pointer, "__init__.py")
            return pkg_path, "*"

        if import_chain_proced.endswith(".*"):
            pkg_name = import_chain_proced[:-2]
            pkg_path = utilities.find_pkg_path(pointer, pkg_name, libs)
            return pkg_path, "*"

        pkg_name = import_chain_proced
        pkg_path = utilities.find_pkg_path(pointer, pkg_name, libs)
        if pkg_path:
            return pkg_path, None
        import_chain_segs = import_chain_proced.split(".")
        pkg_name = ".".join(import_chain_segs[:-1])
        obj_name = import_chain_segs[-1]
        if pkg_name == "":
            return None, None

        pkg_path = utilities.find_pkg_path(pointer, pkg_name, libs)
        if pkg_path:
            return pkg_path, obj_name

        return None, None

    def flush(self):
        self._data = {}

    def items(self):
        return iter(self._data.items())

    def iteritems(self):
        return iter(self._data.items())

    def __setitem__(self, key, value):
        self._data[key] = value

    def __getitem__(self, key):
        return self._data[key]

    def __contains__(self, key):
        return key in self._data
