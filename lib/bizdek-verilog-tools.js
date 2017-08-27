'use babel';

import {
  CompositeDisposable
} from 'atom';

export default {
  config : {
    'headerFile' : {
      'title': 'Header for verilog files',
      'description': 'File containing header for header insert functionality.',
      'type' : 'string',
      'default' : 'Filepath'
    }
  },

  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'bizdek-verilog-tools:generateTestBench': () => this.generateTestBench(),
      'bizdek-verilog-tools:insertHeader': () => this.insertHeader(),
      'bizdek-verilog-tools:copyModule': () => this.copyModule()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {},

  generateTestBench() {
    console.log("Generate test bench");
    atom.notifications.addWarning("xy");
  },

  insertHeader() {
    console.log("Insert header");
    console.log(atom.config.get('bizdek-verilog-tools.headerFile'));
    atom.notifications.addSuccess("test"); //add option for success messages
    atom.workspace.open().then(function(editor){
      console.log("I was here");
      editor.setText("Enzo"); //works good
    });

  },

  copyModule() {
    console.log("copy module");
    atom.clipboard.write("Test");
  },

  reportSuccess(msg){
    if(nekaj) atom.notifications.addSuccess(msg);
  },

  reportWarning(msg){
    atom.notifications.addWarning(msg);
  }

};
