"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FocusFoldingRangeProvider = void 0;
const vscode = require("vscode");
class FocusFoldingRangeProvider {
  constructor(filterArr) {
    this.filterArr = filterArr;
  }
  provideFoldingRanges(document, context, token) {
    let sourceCode = document.getText();
    const sourceCodeArr = sourceCode.split("\n");
    let lastShownLine = 0;
    const foldingRanges = [];
    for (let lineIdx = 0; lineIdx < sourceCodeArr.length; lineIdx++) {
      for (const filter of this.filterArr) {
        if (!filter.isShown) {
          continue;
        }
        let regex = filter.regex;
        if (regex.test(sourceCodeArr[lineIdx])) {
          foldingRanges.push(new vscode.FoldingRange(lastShownLine, lineIdx - 1));
          lastShownLine = lineIdx;
          break;
        }
      }
    }
    foldingRanges.push(new vscode.FoldingRange(lastShownLine, sourceCodeArr.length - 1));
    return foldingRanges;
  }
}
exports.FocusFoldingRangeProvider = FocusFoldingRangeProvider;
//# sourceMappingURL=foldingRangeProvider.js.map