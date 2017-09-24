from __future__ import print_function
from sys import exit, stderr


def errPrint(*args, **kwargs):
    print(*args, file=stderr, **kwargs)


def errPrintAndExit(*args, **kwargs):
    errPrint(*args, **kwargs)
    exit(1)


# how many chars are needed for alignment to (first/last)char in last line of s
def spacesForAlignment(s, alignTo="(", first=True, maxLen=-1):
    pos = s.rfind("\n")
    if pos != -1:
        s = s[pos:]

    if first:
        pos = s.find(alignTo)
    else:
        pos = s.rfind(alignTo)

    if pos != -1:
        if pos > maxLen:
            pos = maxLen
        return " "*pos
    return ""


# formats lines of s to multiple lines with maximum len of maxLineLen,
# lines are separated only when valid separator is available and are aligned to alignTo
def formatLine(s, alignTo="(", validSep=",", maxLineLen=120):
    lines = s.split("\n")
    ret = ""
    for l in lines:
        if len(l) > maxLineLen:
            alignment = spacesForAlignment(s, alignTo=alignTo, maxLen=maxLineLen//2)
            pos = 0
            while len(l[pos:]) > maxLineLen:
                pos = l.rfind(validSep, pos, pos + maxLineLen)
                if pos == -1:
                    break
                pos += 1
                l = l[:pos] + "\n" + alignment + l[pos:]
                pos += 1
        ret += l + "\n"
    return ret[:-1]  # removing last '\n'
