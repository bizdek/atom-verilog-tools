'use babel';

const fs = require('fs');
//common helpers
export default {
  getProjectPath() {
    var proPaths = atom.project.getPaths();
    if (proPaths && proPaths.length) {
      return proPaths[0]; // TODO: Currently only one/first project is an option
    }
    Reporter.warning("No project opened!");
    return null;
  },
  //check if file or folder is in project folder or is project folder
  belongsToProject(path) {
    var proPath = this.getProjectPath();
    if (!proPath) {
      return false;
    }
    if (path.indexOf(proPath) == 0) {
      return true;
    }
    return false;
  },

  getFilesFolder(path) {
    var ret = path.replace('/', '\\').split('\\');
    ret.pop();
    return ret.join('\\');
  },

  getFilesFromFolder(path, subfolders) {
    if (!fs.existsSync(path) || !fs.lstatSync(path).isDirectory()) {
      return [];
    }
    files = [];
    filesFromFolder(files, path, subfolders);
    return files;
  },

  isVerilogFile: _isVerilogFile

};

function _isVerilogFile(path) {
  const verilogExt = ['v','sv','vh','svh'];
  return verilogExt.includes(editor.getTitle().split('.').pop());
}

function filesFromFolder(files, path, subfolders) {
  fs.readdirSync(path).forEach((p) => {
    p = path + '\\' + p;
    if (fs.lstatSync(p).isFile() && _isVerilogFile(p)) {
      files.push(p);
    } else if (subfolders) {
      filesFromFolder(files, p, subfolders);
    }

  });
}
