'use babel';

//Verilog helper functions

export default{
  isVerilog(editor) {
    return editor.getGrammar().scopeName == "source.verilog";
  },

  isComment(editor, point) {
    var scopeArray = editor.scopeDescriptorForBufferPosition(point).getScopesArray();
    for (var i = 0; i < scopeArray.length; i++) {
      if (scopeArray[i].indexOf('comment') != -1) {
          return true;
      }
    }
    return false;
  },

  removeComments(str){
    //remove line comments
    str = str.replace(/\/\/.*/g,"");
    //remove block comments
    return str.replace(/\/\*[\s\S]*?\*\//g,"");
  }
};
