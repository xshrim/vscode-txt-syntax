"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSymbolProvider = void 0;
const vscode = require("vscode");
/**
 * DocumentSymbolProvider
 */
class DocumentSymbolProvider {
  constructor() {
    this.symbols = [];
    this._onDidChangeSymbols = new vscode.EventEmitter();
    this.regex = /^-\*-|^\*[^\S\r\n]|^[A-Z0-9]+\.\s|^\[.+\]\s*|^(Section|SECTION|Chapter|CHAPTER|Sheet|SHEET|Season|SEASON|Period|PERIOD|Round|ROUND|Class|CLASS|Term|TERM|Part|PART|Page|PAGE|Segment|SEGMENT|Paragraph|PARAGRAPH|Lesson|LESSON|Region|REGION|Step|STEP|Level|LEVEL|Set|SET|Grade|GRADE|Year|YEAR|Month|MONTH|Week|WEEK|Day|DAY)[^\S\r\n][A-Z0-9]+\.?($|[^\S\r\n])|^(第[^\S\r\n]|第)?[一二三四五六七八九十百千万亿兆零壹贰叁肆伍陆柒捌玖拾佰仟甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]+($|[^\S\r\n])?[章节篇部首回手课页段组卷区场合季级集任步条件年月日周天轮个项类期话例]?($|[\.、]|[^\S\r\n])|^(第[^\S\r\n]|第)?[0123456789]+[^\S\r\n]?[章节篇部首回手课页段组卷区场合季级集任步条件年月日周天轮个项类期话例]($|[\.、]|[^\S\r\n])|^(第[^\S\r\n]|第)[0123456789]+($|[\.、]|[^\S\r\n])/;
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeSymbols.fire();
    });
  }
  // format(cmd) {
  //   return cmd.substr(1).toLowerCase().replace(/^\w/, c => c.toUpperCase());
  // }
  provideDocumentSymbols(document, token) {
    return new Promise((resolve, reject) => {
      this.symbols = [];
      // let symbolkind_marker = vscode.SymbolKind.Field;
      // let symbolkind_run = vscode.SymbolKind.Event;
      // let symbolkind_cmd = vscode.SymbolKind.Function;
      for (var i = 0; i < document.lineCount; i++) {
        var line = document.lineAt(i);
        // let tokens = line.text.split(" ");
        if (this.regex.test(line.text)) {
          let symbol = new vscode.DocumentSymbol(line.text, '', vscode.SymbolKind.Field, line.range, line.range); // this.format(tokens[0]) + " " + tokens[1]
          this.symbols.push(symbol)
        }
      }
      resolve(this.symbols);
    });
  }
}
exports.DocumentSymbolProvider = DocumentSymbolProvider;
