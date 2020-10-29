'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const tree = require("./tree");
var Modes;
(function (Modes) {
  Modes[Modes["Default"] = 0] = "Default";
  Modes[Modes["WholeWord"] = 1] = "WholeWord";
  Modes[Modes["IgnoreCase"] = 2] = "IgnoreCase";
  Modes[Modes["Both"] = 3] = "Both";
})(Modes || (Modes = {}));
const qpOptions = ['ignore case', 'whole word', 'both'];
class Highlight {
  constructor() {
    this.words = [];
    this.decorators = [];
    this.treeProvider = new tree.default(this.getWords());
    this.ranges = {};
    vscode.window.registerTreeDataProvider('txtsyntaxHighlightExplore', this.treeProvider);
  }
  setMode(m) { this.mode = m; }
  getMode() { return this.mode; }
  getWords() { return this.words; }
  setDecorators(d) { this.decorators = d; }
  getLocationIndex(expression, range) {
    this.treeProvider.currentExpression = expression;
    this.treeProvider.currentIndex = { index: 0, count: 0 };
    Object.keys(this.ranges[expression]).some((r, i) => {
      const thisrange = this.ranges[expression][i];
      if (thisrange.start.character == range.start.character && thisrange.start.line == range.start.line) {
        this.treeProvider.currentIndex = { index: i + 1, count: this.ranges[expression].length };
        return true;
      }
    });
    this.treeProvider.refresh();
  }
  updateDecorations(active) {
    vscode.window.visibleTextEditors.forEach(editor => {
      if (active && editor.document != vscode.window.activeTextEditor.document)
        return;
      const text = editor.document.getText();
      let match;
      let decs = [];
      this.decorators.forEach(function () {
        let dec = [];
        decs.push(dec);
      });
      this.words.forEach((w, n) => {
        const opts = w.ignoreCase ? 'gi' : 'g';
        const expression = w.wholeWord ? '\\b' + w.expression + '\\b' : w.expression;
        const regEx = new RegExp(expression, opts);
        this.ranges[w.expression] = [];
        while (match = regEx.exec(text)) {
          const startPos = editor.document.positionAt(match.index);
          const endPos = editor.document.positionAt(match.index + match[0].length);
          const decoration = { range: new vscode.Range(startPos, endPos) };
          decs[n % decs.length].push(decoration);
          this.ranges[w.expression].push(decoration.range);
        }
      });
      this.decorators.forEach(function (d, i) {
        editor.setDecorations(d, decs[i]);
      });
      this.treeProvider.words = this.words;
      this.treeProvider.refresh();
    });
  }
  clearAll() {
    this.words = [];
    this.updateDecorations();
  }
  remove(word) {
    if (!word)
      return;
    if (word.label == '* All *')
      this.words = [];
    else {
      const highlights = this.words.filter(w => w.expression == word.label);
      if (highlights && highlights.length) {
        this.words.splice(this.words.indexOf(highlights[0]), 1);
      }
    }
    this.updateDecorations();
  }
  updateActive() {
    this.updateDecorations(true);
  }
  updateOptions(word) {
    vscode.window.showQuickPick(["default"].concat(qpOptions)).then(option => {
      if (!option)
        return;
      const theword = this.words.map(w => w.expression).indexOf(word);
      this.words[theword] = {
        expression: word,
        wholeWord: option == 'whole word' || option == 'both',
        ignoreCase: option == 'ignore case' || option == 'both'
      };
      this.updateDecorations();
    });
  }
  toggleSelected(withOptions) {
    const editor = vscode.window.activeTextEditor;
    let word = editor.document.getText(editor.selection);
    if (!word) {
      const range = editor.document.getWordRangeAtPosition(editor.selection.start);
      if (range)
        word = editor.document.getText(range);
    }
    if (!word) {
      vscode.window.showInformationMessage('Nothing selected!');
      return;
    }
    word = word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"); // raw selected text, not regexp
    const highlights = this.words.filter(w => w.expression == word); // avoid duplicates
    if (!highlights || !highlights.length) {
      if (withOptions) {
        vscode.window.showQuickPick(qpOptions).then(option => {
          if (!option)
            return;
          this.words.push({
            expression: word,
            wholeWord: option == 'whole word' || option == 'both',
            ignoreCase: option == 'ignore case' || option == 'both'
          });
          this.updateDecorations();
        });
      }
      else {
        const ww = this.mode == Modes.WholeWord || this.mode == Modes.Both;
        const ic = this.mode == Modes.IgnoreCase || this.mode == Modes.Both;
        this.words.push({ expression: word, wholeWord: ww, ignoreCase: ic });
        this.updateDecorations();
      }
    }
    else if (highlights.length) {
      this.words.splice(this.words.indexOf(highlights[0]), 1);
      this.updateDecorations();
    }
  }
  toggleRegExp(word) {
    try {
      let opts = '';
      if (word.indexOf('/') == 0) {
        const slashes = word.split('/');
        opts = slashes[slashes.length - 1];
        word = word.slice(1, word.length - opts.length - 1);
      }
      new RegExp(word);
      const highlights = this.words.filter(w => w.expression == word);
      if (!highlights || !highlights.length) {
        this.words.push({
          expression: word,
          wholeWord: false,
          ignoreCase: !!~opts.indexOf('i')
        });
        this.updateDecorations();
      }
    }
    catch (e) {
      vscode.window.showInformationMessage(word + ' is an invalid expression');
    }
  }
}
exports.default = Highlight;