"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
    function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
    function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FocusProvider = void 0;
const vscode = require("vscode");
//Provide virtual documents as a strings that only contain lines matching shown filters.
//These virtual documents have uris of the form "focus:<original uri>" where
//<original uri> is the escaped uri of the original, unfocused document.
//VSCode uses this provider to generate virtual read-only files based on real files
class FocusProvider {
  constructor(filterArr) {
    this.onDidChangeEmitter = new vscode.EventEmitter();
    this.onDidChange = this.onDidChangeEmitter.event;
    this.filterArr = filterArr;
    this.focusOn = true;
  }
  //open the original document specified by the uri and return the focused version of its text
  provideTextDocumentContent(uri) {
    return __awaiter(this, void 0, void 0, function* () {
      let originalUri = vscode.Uri.parse(uri.path);
      let sourceCode = yield vscode.workspace.openTextDocument(originalUri);
      // start the string with an empty line to make room for the focus mode text decoration
      let resultArr = [''];
      for (let lineIdx = 0; lineIdx < sourceCode.lineCount; lineIdx++) {
        const line = sourceCode.lineAt(lineIdx).text;
        let flag = false;
        for (const filter of this.filterArr) {
          if (!filter.isShown) {
            continue;
          }
          let regex = filter.regex;
          if (regex.test(line)) {
            flag = true;
            break;
          }
        }
        if (!(flag ^ this.focusOn)) {
          resultArr.push(line);
        }
      }
      return resultArr.join('\n');
    });
  }
  //when this function gets called, the provideTextDocumentContent will be called again
  refresh(uri) {
    this.onDidChangeEmitter.fire(uri);
  }

  switchFocus() {
    if (this.focusOn) {
      this.focusOn = false
    } else {
      this.focusOn = true
    }
  }
}
exports.FocusProvider = FocusProvider;
//# sourceMappingURL=focusProvider.js.map