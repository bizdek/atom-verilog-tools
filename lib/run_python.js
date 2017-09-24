'use babel';

const cp = require('child_process');

export default function runPython(script, args, callback){
  args.unshift(script);
  args.unshift("python"); // TODO: add config option
  cp.exec(args.join(" "), {cwd: __dirname + '\\..\\pysrc', timeout: 10000},
  (err, stdout, stderr) => {
    var retCode = 0;
    if (err) {
      retCode = err.code;
    }
    callback({stdout: stdout, stderr: stderr, ret: retCode})
  });
};
