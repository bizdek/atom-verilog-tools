from __future__ import absolute_import
from __future__ import print_function

import os
from optparse import OptionParser

from customParse import parse
from pyverilog.dataflow.modulevisitor import ModuleVisitor
from common import *


def copyModule():
    optionParser = OptionParser()
    optionParser.add_option("-I", "--include", dest="include", action="append", default=[], help="Include path")
    optionParser.add_option("-D", dest="define", action="append", default=[], help="Macro Definition")
    optionParser.add_option("-T", dest="targetModuleName", default=None, help="Predicted module name")

    (options, args) = optionParser.parse_args()

    fileList = args

    for f in fileList:
        if not os.path.exists(f):
            errPrintAndExit("File :" + f + " does not exist.")

    ast = None
    try:
        ast, directives = parse(fileList,
                                preprocess_include=options.include,
                                preprocess_define=options.define)
    except Exception as e:
        errPrintAndExit('Syntax error: (Line is probably not correct)\n' + str(e))

    if not ast:
        errPrintAndExit("No module found.")

    modVisitor = ModuleVisitor()
    modVisitor.visit(ast)
    modules = modVisitor.get_modulenames()

    if len(modules) == 0:
        errPrintAndExit("No module found.")

    pos = 0
    moduleNotFound = False
    if options.targetModuleName and len(modules) > 1:
        moduleNotFound = True
        if options.targetModuleName in modules:
            pos = modules.index(options.targetModuleName)
            moduleNotFound = False

    infoTable = modVisitor.get_moduleinfotable()
    # print(infoTable.getIOPorts(modules[pos])) returns only ports without line numbers and width

    ret = modules[pos] + " "
    params = infoTable.getParamNames(modules[pos])
    if params:
        ret += "#("
        for p in params:
            ret += "."+p + "(value), "
        ret = ret[:-2] + ") "  # removing the last ', '

    ret += "u_"+modules[pos] + "("
    ret = formatLine(ret, maxLineLen=100)

    moduleSignals = infoTable.getSignals(modules[pos])
    first = True
    curLine = 0
    alignment = spacesForAlignment(ret, first=False, maxLen=20)
    while moduleSignals:
        signal = moduleSignals.popitem(last=False)[1][0]  # this is how you access the signal
        if first:
            curLine = signal.lineno - 1
            first = False

        while curLine < signal.lineno:
            ret += "\n"
            curLine += 1

        ret += alignment + "." + signal.name + "(),"

    if not first:
        # remove last ','
        ret = ret[:-1] + "\n" + alignment
    ret += ");"

    print(ret)
    if moduleNotFound:
        errPrint("First module selected.")

if __name__ == '__main__':
    copyModule()
