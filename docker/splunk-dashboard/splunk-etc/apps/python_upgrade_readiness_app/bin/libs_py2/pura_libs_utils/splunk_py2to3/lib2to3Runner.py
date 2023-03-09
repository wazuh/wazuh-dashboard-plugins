from __future__ import print_function
from lib2to3.main import  StdoutRefactoringTool, diff_texts
from lib2to3 import refactor
import os
import sys

DEFAULT_FIXES = [
    'lib2to3.fixes.fix_apply',
    'lib2to3.fixes.fix_except',
    'lib2to3.fixes.fix_exitfunc',
    'lib2to3.fixes.fix_funcattrs',
    'lib2to3.fixes.fix_has_key',
    'lib2to3.fixes.fix_idioms',
    'lib2to3.fixes.fix_intern',
    'lib2to3.fixes.fix_isinstance',
    'lib2to3.fixes.fix_methodattrs',
    'lib2to3.fixes.fix_ne',
    'lib2to3.fixes.fix_numliterals',
    'lib2to3.fixes.fix_paren',
    'lib2to3.fixes.fix_reduce',
    'lib2to3.fixes.fix_renames',
    'lib2to3.fixes.fix_repr',
    'lib2to3.fixes.fix_standarderror',
    'lib2to3.fixes.fix_sys_exc',
    'lib2to3.fixes.fix_throw',
    'lib2to3.fixes.fix_tuple_params',
    'lib2to3.fixes.fix_types',
    'lib2to3.fixes.fix_ws_comma',
    'lib2to3.fixes.fix_xreadlines',
    'libfuturize.fixes.fix_absolute_import',
    'libfuturize.fixes.fix_next_call',
    'libfuturize.fixes.fix_print_with_import',
    'libfuturize.fixes.fix_raise',
    'lib2to3.fixes.fix_dict',
    'lib2to3.fixes.fix_exec',
    'lib2to3.fixes.fix_getcwdu',
    'libmodernize.fixes.fix_basestring',
    # 'libmodernize.fixes.fix_dict_six',
    'libmodernize.fixes.fix_filter',
    'libmodernize.fixes.fix_imports_six',
    'libmodernize.fixes.fix_input_six',
    'libmodernize.fixes.fix_int_long_tuple',
    'libmodernize.fixes.fix_itertools_imports_six',
    'libmodernize.fixes.fix_itertools_six',
    'libmodernize.fixes.fix_metaclass',
    'libmodernize.fixes.fix_next',
    'libmodernize.fixes.fix_open',
    'libmodernize.fixes.fix_unicode_type',
    'libmodernize.fixes.fix_urllib_six',
    'libmodernize.fixes.fix_xrange_six',
    'libmodernize.fixes.fix_zip',
    'splunk_py2to3.fixes.fix_spl_ospath',
    'splunk_py2to3.fixes.fix_spl_ceil',
    'splunk_py2to3.fixes.fix_spl_floor',
    'splunk_py2to3.fixes.fix_spl_unicode'
]


class CustomRefactoringTool(StdoutRefactoringTool):


    def print_output(self, old, new, filename, equal):
        if not equal:
            diff_lines = diff_texts(old, new, filename)
            for line in diff_lines:
                # print line
                self.result = self.result + [line]
            if self.fixer_log:
                self.result = self.result + ["@@ Warnings/messages while checking the script: @@"] + self.fixer_log
            self.result = self.result + ['-'*24]






def runFuturize(filename,fixes=DEFAULT_FIXES):
    rt = CustomRefactoringTool(
        fixes, {}, set(),
        False, True,
        input_base_dir=os.path.dirname(filename),
        output_dir="",
        append_suffix=""
    )
    rt.result = []
    # Refactor all files and directories passed as arguments
    if not rt.errors:
        try:
            rt.refactor([filename], False, False, 1)
        except refactor.MultiprocessingUnsupported:
            print("Sorry, -j isn't supported on this platform.", file=sys.stderr)
            exit(1)
    if rt.errors:
        rt.result = rt.result + ["Error while checking the script:"] + [msg % args for msg, args, kwds in rt.errors] + ['-'*24]

    return rt.result
