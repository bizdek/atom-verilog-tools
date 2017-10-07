'use babel';

import {
  CompositeDisposable
} from 'atom';

const json_links = require('./json_links');

export default {
  config : require('./config'),

  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'verilog-tools:createLinkFile': () => json_links.createLinkFile(),
      'verilog-tools:linkFiles': () => json_links.linkFiles(),
      'verilog-tools:linkFolders': () => json_links.linkFolders(),
      'verilog-tools:linkIncludeFolders': () => json_links.linkIncludeFolders(),
      'verilog-tools:importFiles': () => json_links.importFiles(),
      'verilog-tools:insertHeader': () => require('./header').insertHeader()
    }));

    this.subscriptions.add(atom.workspace.observeTextEditors(
      require('./highlight').textEditorChangedCallback));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  serialize() {},

  provideIntentions(){
    return {
      grammarScopes: ['source.verilog'],
      getIntentions: require('./intentions')
    }
  }

};
