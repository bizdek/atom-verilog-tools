
# print(signal.width)
# print(signal.width.lsb)
# print(signal.width.msb)


from __future__ import absolute_import
from __future__ import print_function

import os
from optparse import OptionParser

from customParse import parse
from pyverilog.dataflow.modulevisitor import ModuleVisitor
from pyverilog.ast_code_generator.codegen import ASTCodeGenerator
from common import *

UNKNOWN = "0"
INITIAL = "0"


def generateTestbench():
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
    codeGen = ASTCodeGenerator()

    ret = modules[pos] + " "
    params = infoTable.getParamNames(modules[pos])
    print("`define CLK_EDGE_WIDTH = " + UNKNOWN + ";\n")
    print("\nmodule " + modules[pos] + "_test();\n")
    for p in params:
        print("localparam " + p + " = " + UNKNOWN + ";")

    print("\n\nreg clk;\nreg rst;\n")  # TODO: auto find clock and rst of module
    if params:
        ret += "#("
        for p in params:
            ret += "." + p + "(" + p + "), "
        ret = ret[:-2] + ") "  # removing the last ', '

    ret += "tb_"+modules[pos] + "("
    ret = formatLine(ret, maxLineLen=100)

    moduleSignals = infoTable.getSignals(modules[pos])
    first = True
    curLine = 0
    regs = ["clk", "rst"]
    alignment = spacesForAlignment(ret, first=False, maxLen=20)
    while moduleSignals:
        signal = moduleSignals.popitem(last=False)[1][0]  # this is how you access the signal
        ioType = type(signal).__name__   # Input, Output, Inout
        width = None
        if signal.width:
            width = codeGen.visit(signal.width)  # we generate only once

        if ioType == "Input":
            s = "reg "
            regs.append(signal.name + "_tb")
        elif ioType == "Inout":
            s = "wire "  # TODO: add support for three state - wire and reg and assigments
        else:  # Wire
            s = "wire "

        if width:
            s += width + " "
        print(s + signal.name + "_tb;")

        if first:
            curLine = signal.lineno - 1
            first = False

        while curLine < signal.lineno:
            ret += "\n"
            curLine += 1

        ret += alignment + "." + signal.name + "(" + signal.name + "_tb),"

    if not first:
        # remove last ','
        ret = ret[:-1] + "\n" + alignment
    ret += ");"

    alignment = "    "
    print("initial begin")
    for r in regs:
        print(alignment + r + " = " + INITIAL + ";")
    print("end\n")
    print("always #`CLK_EDGE_WIDTH clk = ~clk;\n")
    print(ret)
    print("\n\nendmodule")

    if moduleNotFound:
        errPrint("First module selected.")

if __name__ == '__main__':
    generateTestbench()
