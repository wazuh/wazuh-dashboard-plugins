import inspect
import logging
import os
import os.path
import itertools
from . import (
    ast_analyzer,
    ast_info_store,
    file_dep_manager,
)
from .utilities import get_hash_file

from pura_libs_utils import CancelScan
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'libs_py3'))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'libs_py3','pura_libs_utils'))

from pura_libs_utils import pura_logger_manager as logger_manager

logging = logger_manager.setup_logging('eura_check_python_tls')

class TrustedLibsManager(object):
    def __init__(
        self,
        trusted_checks_and_libs_file=None,
        untrusted_check_and_libs_file=None,
    ):
        # self.libs_data = trusted_data_collector.TrustedDataCollector(
        #     trusted_checks_and_libs_file, untrusted_check_and_libs_file
        # )
        ...

    def check_if_lib_is_trusted(self, checkname, lib=None, content_hash=None):
        """
        check the (checkname, lib) is trusted or not
        :param checkname: check name
        :param lib: lib
        :return: true: the lib is trusted   false: the lib is untrusted
        """
        return False

class Client(object):
    """
    One app contains one client
    """

    def __init__(
        self,
        filepaths=None,
        files_folder=None,
        modules_metadata=None,
        trusted_libs_manager=TrustedLibsManager(),
    ):
        try:
            # initialize some variables
            self._dependency_graphs = {}
            # build graph
            assert filepaths is not None or files_folder is not None
            self.set_prior_known_filepath(files_folder)
            libs = None
            if files_folder:
                # Hardcode bin/lib folder as always searching paths,
                # as these two are Splunk default lib folder.
                libs = [
                    os.path.join(files_folder, "bin"),
                    os.path.join(files_folder, "lib"),
                ]
            self.file_dep_manager = file_dep_manager.FileDepManager(files_folder, libs=libs)
            self.ast_info_store = ast_info_store.AstInfoStore(libs=libs)
            self.modules_metadata = modules_metadata
            self.trusted_libs = trusted_libs_manager

            logging.debug("DepManager and Trustedlibs initialization succeeded")

            if files_folder:
                self.file_dep_manager.add_folder(files_folder)
            if filepaths:
                for filepath in filepaths:
                    self.file_dep_manager.add_file(filepath)
            # populate graph
            self._process_files()
        except CancelScan.CancelScanException as ce:
            self.remove_raw_files()
            raise ce

    @property
    def has_circular_dependency(self):
        return self.file_dep_manager.has_circular_dependency

    def get_circular_dependency(self):
        relative_filepath_comps = []
        for abs_filepath_comp in self.file_dep_manager.get_circular_dependency():
            if not abs_filepath_comp:
                continue
            relative_filepath_comp = []
            for abs_filepath in abs_filepath_comp:
                relative_filepath_comp.append(self._relativize_filepath(abs_filepath))
            relative_filepath_comps.append(relative_filepath_comp)
        return relative_filepath_comps

    def get_circular_dependency_loops(self):
        relative_filepath_comps = []
        for (
            abs_filepath_comp_loops
        ) in self.file_dep_manager.find_circular_dependency_loops():
            relative_filepath_comp_loops = []
            for abs_filepath_loop in abs_filepath_comp_loops:
                relative_filepath_loop = map(
                    lambda e: (self._relativize_filepath(e[0]), e[1]), abs_filepath_loop
                )
                relative_filepath_comp_loops.append(relative_filepath_loop)
            relative_filepath_comps.append(relative_filepath_comp_loops)
        sccs = self.get_circular_dependency()
        scc_loops_map = {}
        for idx, scc in enumerate(sccs):
            key = tuple(scc)
            scc_loops_map[key] = relative_filepath_comps[idx]
        return scc_loops_map

    def get_ast_info(self, filepath):
        """Get corresponding AST analyzer

        Args:
            filepath (String): If provided, return the ast analyzer.

        Returns:
        """
        abs_filepath = self._absolutize_filepath(filepath)
        assert abs_filepath in self.ast_info_store, "Provide valid filepath."
        return self.ast_info_store[abs_filepath]

    def get_all_ast_infos(self, check_name=None):
        return self._trusted_libs_filter(
            set(self.file_dep_manager.iter_files()), check_name=check_name
        )

    def get_syntax_error_files(self, check_name=None):
        return set(
            map(
                lambda result: result[0],
                self._trusted_libs_filter(
                    set(self.file_dep_manager.get_syntax_error_files()),
                    check_name=check_name,
                ),
            )
        )

    def get_null_byte_error_files(self, check_name=None):
        return set(
            map(
                lambda result: result[0],
                self._trusted_libs_filter(
                    set(self.file_dep_manager.get_null_byte_error_files()),
                    check_name=check_name,
                ),
            )
        )

    def get_other_exception_files(self):
        return set(
            map(
                self._relativize_filepath,
                self.file_dep_manager.get_other_exception_files(),
            )
        )

    def get_hidden_python_files(self):
        return set(
            map(
                self._relativize_filepath,
                self.file_dep_manager.get_hidden_python_files(),
            )
        )

    def get_dependences(self, filepath):
        """
        return python file's dependency tree
        eg:
                   c
                  /
                 b
                /
               a
        so the result for `a` should be like:
        {'parents': [
                      {'parents': [
                                   {'parents': [],
                                    'filepath': c filepath}
                                  ],
                      'filepath': b filepath}
                    ],
         'filepath': a filepath}
        """
        abs_filepath = self._absolutize_filepath(filepath)
        return self.file_dep_manager.get_dependences(abs_filepath)

    def load_modules(self, import_chain):
        pkg_path, obj_name = self.ast_info_store.get_pkg_path_and_obj_name(import_chain)
        if (pkg_path is None) or (pkg_path not in self.ast_info_store):
            if self.modules_metadata is None:
                return []
            obj_metadata_list = self.modules_metadata.query_namespace(import_chain)
            modules_list = []
            for func_metadata in obj_metadata_list:
                modules_list.append(func_metadata.instantiate())
            return modules_list
        if obj_name == "*":
            analyzer = self.ast_info_store[pkg_path]
            modules_list = []
            for exposed_mod in analyzer.exposed_module_set:
                if exposed_mod in analyzer.module.global_map:
                    modules_list.append(analyzer.module.global_map[exposed_mod])
                else:
                    # Very edge case
                    modules_list += self.load_modules(
                        import_chain[:-2] + "." + exposed_mod
                    )
            return modules_list

        if obj_name is None:
            analyzer = self.ast_info_store[pkg_path]
            return [analyzer.module]

        analyzer = self.ast_info_store[pkg_path]
        if obj_name in analyzer.module.global_map:
            return [analyzer.module.global_map[obj_name]]
        return []

    def set_prior_known_filepath(self, folderpath):
        if not folderpath:
            self.prior_known_filepath = None
            return
        self.prior_known_filepath = (
            folderpath[:-1] if folderpath[-1] == "/" else folderpath
        )

    def _relativize_filepath(self, abs_filepath):
        if self.prior_known_filepath and abs_filepath.startswith(
            self.prior_known_filepath
        ):
            return abs_filepath[len(self.prior_known_filepath) + 1 :]

        return abs_filepath

    def _absolutize_filepath(self, relative_filepath):
        if self.prior_known_filepath and not relative_filepath.startswith(
            self.prior_known_filepath
        ):
            return os.path.join(self.prior_known_filepath, relative_filepath)

        return relative_filepath

    def remove_raw_files(self):
        # remove all .bak and .raw files
        try:
            for filepath in itertools.chain(
                self.file_dep_manager.iter_all_app_python_files(),
                self.file_dep_manager.get_syntax_error_files(),
                self.file_dep_manager.get_other_exception_files(),
                self.file_dep_manager.get_null_byte_error_files(),
                self.file_dep_manager.get_hidden_python_files()
            ):
                if os.path.exists(filepath + ".bak"):
                    os.remove(filepath + ".bak")
                if os.path.exists(filepath + ".raw"):
                    os.remove(filepath + ".raw")
        except Exception as e:
            logging.exception(str(e))
        return

    def _process_files(self):
        """
        Traverse dependency graph in topological order, parse AST-analyzer
        for all files

        If cycle is detected, this function will degrade to for-loop implementation
        like `for filepath in filepaths:
                  ast_analyzer = AstAnalyzer(filepath)`
        """
        logging.debug("start file or folder processing")
        for filepath in self.file_dep_manager.iter_files():
            logging.debug("start `%s` processing", filepath)
            CancelScan.CancelScan.get_instance().check_cancelled_scan()
            self.ast_info_store.set_pointer(filepath)
            self.ast_info_store[filepath] = ast_analyzer.AstAnalyzer(
                python_file_path=filepath, module_manager=self
            )

            # special process for 2to3 backup files and preprocessed files
            if os.path.exists(filepath + ".raw"):
                self.ast_info_store[filepath].content_hash = get_hash_file(
                    open(filepath + ".raw", "rb").read()
                )
            elif os.path.exists(filepath + ".bak"):
                self.ast_info_store[filepath].content_hash = get_hash_file(
                    open(filepath + ".bak", "rb").read()
                )

            logging.debug("`%s` process succeeded", filepath)

        self.remove_raw_files()

    def _trusted_libs_filter(self, filepaths, check_name=None):
        if check_name is None:
            frame = inspect.currentframe().f_back
            while frame:
                name = frame.f_code.co_name
                if name.startswith("check_"):
                    check_name = name
                    break
                frame = frame.f_back
        assert check_name is not None and check_name.startswith(
            "check_"
        ), "Appropriate check name should be provided to trustedlib, {check_name} is given".format(check_name=check_name)
        logging.info(check_name)
        for filepath in filepaths:
            relative_path = self._relativize_filepath(filepath)
            # if it is a well-formed python file
            if filepath in self.ast_info_store:
                filter_result = self.trusted_libs.check_if_lib_is_trusted(
                    check_name, content_hash=self.ast_info_store[filepath].content_hash
                )
            else:
                # otherwise we need to read bytes from python file
                with open(filepath, "rb") as f:
                    filter_result = self.trusted_libs.check_if_lib_is_trusted(
                        check_name, lib=f.read()
                    )
            if not filter_result:
                logging.debug(
                    "get ast info for check: `%s`, file: `%s`", check_name, filepath
                )
                if filepath in self.ast_info_store:
                    yield relative_path, self.ast_info_store[filepath]
                else:
                    yield relative_path, None
            else:
                logging.info("`%s` filtered by trustedlib", filepath)
