'use babel';

import {
  CompositeDisposable,
  Point,
  Range
} from 'atom';

const verilog = require('./verilog');

export default{
  textEditorChangedCallback(editor) {
    if (verilog.isVerilog(editor)) {
      new Highlighter(editor);
    }
  }
};


function collectLetters(array, strArray) {
  for (var i = 0; i < strArray.length; i++) {
    for (var j= 0; j < strArray[i].length; j++) {
      if (array.indexOf(strArray[i][j]) == -1) {
        array.push(strArray[i][j]);
      }
    }
  }
}

const blockStarts = ["begin", "module", "task", "function", "generate"];
const blockEnds = ["end", "endmodule", "endtask", "endfunction", "endgenerate"];
var blockLetters = [];
collectLetters(blockLetters, blockStarts);
collectLetters(blockLetters, blockEnds);


class Highlighter {
  constructor(editor) {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(editor.onDidDestroy(() => this.unsubscript()));
    this.subscriptions.add(editor.onDidChangeCursorPosition((e) => this.cursorChangeHandler(e)));

    this.editor = editor;
    this.startMarker = null;
    this.endMarker = null;
    this.cnt = 0;
    this.selected = {str: null, range: null, pair: null};
  }

  extractBlockWord(str, pos) {
    var left = pos.column - 1;
    var s = "";
    while ((left >= 0) && (blockLetters.indexOf(str[left]) != -1)) { //first go left
      s = str[left] + s;
      left--;
    }
    left++;
    while ((str.length > pos.column) && (blockLetters.indexOf(str[pos.column]) != -1)) {
      s = s + str[pos.column];
      pos.column++;
    }
    this.selected.str = s;
    this.selected.range = new Range( new Point(pos.row, left), pos);
  }

  cursorChangeHandler(event) {
    this.cleanMark();
   if (!this.editor.buffer.isRowBlank(event.newBufferPosition.row) &&
  	   !verilog.isComment(this.editor, event.newBufferPosition)) {
     this.extractBlockWord(this.editor.buffer.lineForRow(event.newBufferPosition.row),
      event.newBufferPosition);
     var sel;
     var range = this.editor.buffer.getRange();
     if ((sel = blockStarts.indexOf(this.selected.str)) != -1) {
       range.start = this.selected.range.end;
       this.selected.pair = blockEnds[sel];
       this.matchBlock(range, false);
     } else if ((sel = blockEnds.indexOf(this.selected.str)) != -1) {
       range.end = this.selected.range.start;
       this.selected.pair =  blockStarts[sel];
        this.matchBlock(range, true);
     }
   }
 }

  matchBlock(range, revers) {
    this.cnt = 1;
    var regExp = new RegExp('\\b(' + this.selected.str + '|' + this.selected.pair + ')\\b', 'g');
    if (revers) {
      this.editor.buffer.backwardsScanInRange(regExp, range,(o) => this.matchHandler(o));
    } else {
      this.editor.buffer.scanInRange(regExp, range,(o) => this.matchHandler(o));
    }
  }

  matchHandler(obj) {
    if (verilog.isComment(this.editor, obj.range.start)) return;
    if (obj.matchText == this.selected.str) this.cnt++;
    else if (obj.matchText == this.selected.pair) this.cnt--;
    if (this.cnt == 0) {
      obj.stop();
      this.startMarker = this.mark(this.selected.range);
      this.stopMarker = this.mark(obj.range);
    }
  }

  cleanMark() {
    if (this.startMarker) {
      this.startMarker.destroy();
      this.startMarker = null;
      this.stopMarker.destroy();
      this.stopMarker = null;
    }
  }

  mark(range) {
    var marker = this.editor.markBufferRange(range);
    this.editor.decorateMarker(marker, {type: 'highlight', class: 'verilog-matcher'});
    return marker;
  }

  unsubscript() {
    this.subscriptions.dispose();
  }
}
