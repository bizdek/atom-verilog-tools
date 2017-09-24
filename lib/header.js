'use babel';

const fs = require('fs');
const report = require('./report');
export default{
  insertHeader() {
      var linkObj =require('./json_links').getLinkObj();
      var fileName = "";
      if (linkObj && linkObj.header) {
        fileName = linkObj.header;
      } else {
        fileName = atom.config.get('verilog-tools.headerFile');
      }
      if (!fs.existsSync(fileName)) {
        report.warning("Header file specified in the settings does not exist!");
        return;
      }
      var content = fs.readFileSync(fileName, {encoding: 'utf8'});
      var editor = atom.workspace.getActiveTextEditor();
      //here insert write to file
      editor.setCursorBufferPosition([0, 0]);
      if (!editor.insertText(content)) {
        report.warning("Error while inserting header!");
      }
  }
};
