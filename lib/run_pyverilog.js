'use babel';

import runPython from'./run_python';
const common = require('./common');
const report = require('./report');

export default function
runPyVerilog(script, file, links, args, successCallback){
  var files = [];
  var linkObj = require('./json_links').getLinkObj();

  if (file) {
    files.push(file);
  }
  switch (links) {
    case 'all':
    if (linkObj) {
      if (linkObj.linkFiles) {
        linkObj.linkFiles.forEach((f) => addFile(files, f));
      }

      if (linkObj.linkFolders) {
        linkObj.linkFolders.forEach((p) =>
          common.getFilesFromFolder(p, false).forEach(
            (f) => addFile(files, f)));
      }
    }
    case 'projectTree':
      var proFolder = common.getProjectPath();
      common.getFilesFromFolder(proFolder, true).forEach(
        (f) => addFile(files, f));
    case 'includes':
      if (linkObj && linkObj.linkIncludeFolders) {
        linkObj.linkIncludeFolders.forEach((i) => addInclude(args,i));
      }
      files.forEach((f) => addInclude(args, common.getFilesFolder(f)));
      break;
    case 'none':
    default:
      //do nothing
      break;
  }
  //defines
  if (linkObj && linkObj.defines) {
    linkObj.defines.forEach((d) => args.push(('-D ' + d)));
  }

  files.forEach((f) => args.push(f));
  runPython(script, args, (retObj) => {
    //success
    if(retObj.ret == 0){
      if (retObj.stderr != "") {
        report.info(retObj.stderr)
      }
      //call callback with stdout
      successCallback(retObj.stdout);
      return;
    }
    report.warning("Action failed!\n" + retObj.stderr);
  });
};

function addInclude(args, path) {
  var inc = "-I " + path;
  if(!args.includes(inc)) {
    args.push(inc);
  }
}

function addFile(files, path) {
  if (!files.includes(path)) {
    files.push(path);
  }
}
