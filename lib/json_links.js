'use babel';

const fs = require('fs');
const common = require('./common');
const report = require('./report');

export default{
  createLinkFile() {
    var linkFile = getLinkFile();
    if (linkFile) {
      if (fs.existsSync(linkFile)) {
        report.warning("Link file already exists!");
        return;
      }
      fs.writeFileSync(linkFile, JSON.stringify(defaultObject, null, 4));
    }
  },

  linkFiles() {
    var linkObj = parseLinkFile(true);
    if (!linkObj) {
      return;
    }
    var files = selectFiles("Select files for file link");
    if (files) {
      if (linkObj.linkFiles) {
        files.forEach((f) => {
          if (!linkObj.linkFiles.includes(f) || !common.belongsToProject(f)) {
             linkObj.linkFiles.push(f);
          }
        });
      }
      else {
        linkObj.linkFiles = files;
      }
      fs.writeFileSync(getLinkFile(), JSON.stringify(linkObj, null, 4));
    }
  },

  linkFolders() {
    var linkObj = parseLinkFile(true);
    if (!linkObj) {
      return;
    }
    var folders = selectFolders("Select folders for folder link");
    if (folders) {
      if (linkObj.linkFolders) {
        folders.forEach((f) => {
          if (!linkObj.linkFolders.includes(f) || !common.belongsToProject(f)) {
             linkObj.linkFolders.push(f);
          }
        });
      }
      else {
        linkObj.linkFolders = folders;
      }
      fs.writeFileSync(getLinkFile(), JSON.stringify(linkObj, null, 4));
    }
  },

  linkIncludeFolders() {
    var linkObj = parseLinkFile(true);
    if (!linkObj) {
      return;
    }
    var folders = selectFolders("Select folders for include folder link");
    if (folders) {
      if (linkObj.linkIncludeFolders) {
        folders.forEach((f) => {
          if (!linkObj.linkIncludeFolders.includes(f)) {
             linkObj.linkIncludeFolders.push(f);
          }
        });
      }
      else {
        linkObj.linkIncludeFolders = folders;
      }
      fs.writeFileSync(getLinkFile(), JSON.stringify(linkObj, null, 4));
    }
  },

  importFiles() {
    var proPath = common.getProjectPath();
    if (!proPath) {
      return;
    }
    var files = selectFiles("Select files for import");
    if (!files) {
      return;
    }
    files.forEach((f) => {
      var fileName = f.replace('/', '\\').split('\\').pop();
      var newFile = proPath + '\\' + fileName;
      if (fs.existsSync(newFile)) {
        if (atom.confirm({message: "Do you want to overide " + fileName + " ?",
         detailedMessage: "Current project folder already contains file " +
         fileName +"!",
         buttons: ['Yes', 'No']}) == 1) {
            return;
        }
      }
      var rd = fs.createReadStream(f);
      rd.on('error', rejectCleanup);
      var wr = fs.createWriteStream(newFile);
      wr.on('error', rejectCleanup);
      function rejectCleanup(err) {
          rd.destroy();
          wr.end();
          report.warning("Error importing file. <br>" + err);
      }
      rd.pipe(wr);
    });
  },

  getLinkObj() {
    return parseLinkFile(false);
  }
};

var defaultObject = {
  linkFiles: [],
  linkFolders: [],
  linkIncludeFolders: [],
  defines:[],
  header: null
};


function getLinkFile() {
  var projectPath = common.getProjectPath();
  if (projectPath) {
    return (projectPath + "\\verilog-link.json");
  }
  return null;
}

function parseLinkFile(add) {
  var file = getLinkFile();
  if (file) {
    if (fs.existsSync(file)) {
      try {
        return JSON.parse(fs.readFileSync(file));
      }
      catch (e) {
        report.warning("Syntax error in link file.");
        return null;
      }
    }
    if (add && atom.confirm({message: "Do you want to create a new link file?",
     detailedMessage: "Current project folder does not contain a link file.",
     buttons: ['Yes', 'No']}) == 0) {
        return {};
    }
  }
  return null;
}

function selectFiles(title){
  var remote = require('electron').remote;
  var files = remote.dialog.showOpenDialog(remote.getCurrentWindow(),
    {title: title, buttonLabel: "Select",
    filters: [
      {name: 'Verilog files', extensions: ['v','sv','vh','svh']},
      {name: 'All Files', extensions: ['*']}],
    properties: ['openFile', 'multiSelections']});

  if(files && files.length) {
      return files;
  }
  return null;
}

function selectFolders(title){
  var remote = require('electron').remote;
  var folders = remote.dialog.showOpenDialog(remote.getCurrentWindow(),
    {title: title, properties: ['openDirectory', 'multiSelections']});
  if(folders && folders.length) {
      return folders;
  }
  return null;
}
