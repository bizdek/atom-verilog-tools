'use babel';

import runPyVerilog from'./run_pyverilog';
const report = require('./report');

export default function({textEditor, bufferPosition}) {
  // Highest priority is shown first of all
  // Note: You can also return a Promise
  var filePath = textEditor.getPath();
  return [
    {
      priority: 100,
      icon: 'pencil',
      title: 'Generate test bench',
      file: filePath,
      name: null,
      selected: generateTestBench
    },
    {
      priority: 101,
      icon: 'link-external',
      title: 'Copy module',
      file: filePath,
      name: null,
      selected: copyModule
    }
  ]
};

function copyModule() {
  var args = [];
  if (this.name) {
    args.push("-T", this.name);
  }
  runPyVerilog("copyModule.py", this.file, 'includes', args, (str) => {
    atom.clipboard.write(str);
    report.success("Module copied to clipboard.");
  });
}

function generateTestBench() {
  var args = [];
  if (this.name) {
    args.push("-T", this.name);
  }
  runPyVerilog("generateTestbench.py", this.file, 'includes', args, (str) => {
    atom.workspace.open().then((editor) => {
      editor.setText(str);
    }, (err) => report.warning("Error opening new file."));
  });
}
