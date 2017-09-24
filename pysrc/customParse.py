from pyverilog.vparser.parser import VerilogCodeParser
import os
import re


# overriding preprocess method, replacing tasks and functions and removing $ functions, also override parse,
# text from preprocess is none (if it throws exception with none) maybe rewrite the whole class
# do not parse files without modules
# add to copyModule, etc. exception which states that the line could be wrong if syntax error is found by pyverilog

# NOTE: this script supposes that verilog file is syntax error free


class VerilogCodeParserCustom(VerilogCodeParser):
    def __init__(self, fileList, preprocess_output='preprocess.output',
                 preprocess_include=None,
                 preprocess_define=None):
        super(VerilogCodeParserCustom, self).__init__(fileList, preprocess_output,
                                                      preprocess_include, preprocess_define)
        self.reInputs = re.compile(r"input\s+(|\[\d+:\d+\]\s+)(\w+);")  # input name -> group 2
        self.reOutputs = re.compile(r"output\s+(|\[\d+:\d+\]\s+)(\w+);")  # output name -> group 2
        self.reReplace = re.compile(r"\s(\w+)\s*\(")
        self.functions = []
        self.tasks = []

    def parse(self, preprocess_output='preprocess.output', debug=0):  # override
        text = self.preprocess()
        if not text:
            return None
        ast = self.parser.parse(text, debug=debug)
        self.directives = self.parser.get_directives()
        return ast

    def preprocess(self):  # override
        self.preprocessor.preprocess()
        text = open(self.preprocess_output).read()
        os.remove(self.preprocess_output)
        # check if text contains at least 1 module, else return none, parsing wont be executed
        if not self.containsModule(text):
            return None
        text = self.removeComments(text)
        text = self.removeSysFunctions(text)  # because directives with pre delay are not supported
        text = self.parseTasks(text)
        replace = True
        while replace:
            text, replace = self.replaceTasksAndFunctions(text)  # subroutine can include a subroutine
        text = self.removeMultiDelays(text)
        return text

    @staticmethod
    def containsModule(text):
        if re.search(r"\bmodule\b", text):
            return True
        return False

    def syntaxCheck(self):
        # run iverilog -tnull
        # this will be done by package itself as it will call linter before executing this, will proceed only if error
        # free
        pass

    @staticmethod
    def removeMultiDelays(text):
        posRepair = 0
        for m in re.finditer(r"(#\s*\d+)\s+(#\s*\d+\s*)+", text):
            s = m.group(0)
            s = s.replace(" ", "").replace("\t", "").replace("\n", "")
            s = s.split("#")[1:]
            delay = 0
            for i in s:
                delay += int(i)
            s = "#" + str(delay) + " "

            oldLen = len(text)  # for posRepair
            text = text[:m.start() + posRepair] + s + text[m.end() + posRepair:]
            posRepair += len(text) - oldLen
        return text

    @staticmethod
    def removeComments(text):  # could do without but don't need to mind them further on
        # remove line comments
        text = re.sub(r"//.*", "", text)
        # remove block comments
        return re.sub(r"/\*[\s\S]*?\*/", "", text)

    @staticmethod
    def removeSysFunctions(text):
        return re.sub(r"(#.\d+\s+\$|\$)\w+(;|\([\s\S]*?\);)", "", text)

    def parseFunctions(self):
        # pyverilog knows how to handle functions
        pass

    def parseTasks(self, text):
        # collect tasks and remove them from text
        # group 1 = name, group 3 = all inputs and outputs, group 7 = content w/o begin and end
        posRepair = 0
        reExTasks = \
            r"task\s+(\w+)(;|\(\);)[\s]*(((input|output)\s+(|\[\d+:\d+\]\s+)\w+;\s*)*)begin\s+([\s\S]+?)end\s+endtask"
        for task in re.finditer(reExTasks, text):
            t = Task(name=task.group(1), body=task.group(7))
            for i in self.reInputs.finditer(task.group(3)):
                t.addInput(i.group(2))

            o = self.reOutputs.search(task.group(3))
            if o:
                t.addOutput(o=o.group(2))

            t.prepareBody()
            self.tasks.append(t)

            # remove from text

            oldLen = len(text)  # for posRepair
            text = text[:task.start() + posRepair] + text[task.end() + posRepair:]
            posRepair += len(text) - oldLen
        return text

    def replaceTasksAndFunctions(self, text):
        posRepair = 0  # as we replace content the positions of start and end change
        replacedOneOrMore = False
        for sub in self.reReplace.finditer(text):  # will find the start of possible task or function,
            subReplace = None
            # task name = group 1
            if sub.group(1) in self.tasks:
                subReplace = self.tasks[self.tasks.index(sub.group(1))]
            elif sub.group(1) in self.functions:
                subReplace = self.tasks[self.tasks.index(sub.group(1))]
            # if subroutine exists
            if subReplace:
                posReplaceStart = sub.start(1) + posRepair
                posEnd = sub.end() + posRepair  # first char after the bracket
                valid = False
                bracketCnt = 1
                s = ""
                args = []
                while posEnd != len(text):  # parse the bracket content
                    c = text[posEnd]
                    if bracketCnt == 0:  # look for ';', \t \n and ' ' are allowed in between
                        if c not in ['\t', '\n', ' ']:
                            valid = (c == ';')
                            break
                    else:
                        if c == '(':
                            bracketCnt += 1
                        elif c == ')':
                            bracketCnt -= 1
                        elif c == ',' and bracketCnt == 1:
                            args.append(s)
                            s = ""
                        else:
                            s += c

                    posEnd += 1

                if valid:
                    # replace with content of function/task
                    oldLen = len(text)  # for posRepair
                    text = text[:posReplaceStart] + subReplace.getReplaceBody(args) + text[posEnd+1:]
                    posRepair += len(text) - oldLen
                    replacedOneOrMore = True
        return text, replacedOneOrMore


class Subroutine(object):
    def __init__(self, name, body):
        self.name = name
        self.body = body
        self.inputs = []
        self.output = None

    def addInput(self, i):
        self.inputs.append(i)

    def prepareBody(self):
        # string operations which need to be done only once -> assigning the output
        if self.output:
            self.body = re.sub(re.escape(self.output) + r"\s+=", "", self.body)

    def getReplaceBody(self, args):
        ret = self.body
        for i in range(min([len(self.inputs), len(args)])):
            ret = re.sub(r"\b" + re.escape(self.inputs[i]) + r"\b", args[i], ret)
        return ret

    def __str__(self):
        s = self.name + "\n"
        if self.inputs:
            s += "in: "
            for i in self.inputs:
                s += i + ", "
            s = s[:-1] + "\n"
        if self.output:
            s += "out: " + self.output + "\n"
        return s + "body:\n" + self.body

    def __eq__(self, other):
        return other == self.name


class Task(Subroutine):
    def addOutput(self, o):
        self.output = o


class Function(Subroutine):
    def __init__(self, name, body):
        super(Function, self).__init__(name, body)
        self.output = name


# -------------------------------------------------------------------------
def parse(fileList, preprocess_include=None, preprocess_define=None):
    codeParser = VerilogCodeParserCustom(fileList,
                                         preprocess_include=preprocess_include,
                                         preprocess_define=preprocess_define)
    ast = codeParser.parse()
    directives = codeParser.get_directives()
    return ast, directives


if __name__ == "__main__":
    # test for customParser
    parser = VerilogCodeParserCustom(["../verilog_test/pio_test.v"], preprocess_include=["../verilog_test/"])
    # print(parser.preprocess())
    f = open("x.v", "w")
    f.write(parser.preprocess())
    f.close()
    parser.parse()
