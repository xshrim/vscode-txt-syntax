"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodelensProvider = void 0;
const vscode = require("vscode");
/**
 * CodelensProvider
 */
class CodelensProvider {
  constructor() {
    this.codeLenses = [];
    this._onDidChangeCodeLenses = new vscode.EventEmitter();
    this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    this.regex = /^(\w[\w\.\-]*):.*$/g;
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }
  provideCodeLenses(document, token) {
    if (vscode.workspace.getConfiguration("txtsyntax").get("enableCodeLens", true)) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      var lines = document.getText().split("\n");
      lines.forEach((lineText, lineNumber) => {
        if (regex.test(lineText)) {
          const position = new vscode.Position(lineNumber, 0);
          const range = new vscode.Range(position, position);
          this.codeLenses.push(new vscode.CodeLens(range, {
            title: 'make',
            //command: 'workbench.action.terminal.sendSequence',
            command: 'txtsyntax.sendText',
            arguments: [{ text: "make " + lineText.split(":")[0] + "\u000D" }],
          }));
        }
      });
      // let matches;
      // while ((matches = regex.exec(text)) !== null) {
      //   const line = document.lineAt(document.positionAt(matches.index).line);
      //   const indexOf = line.text.indexOf(matches[0]);
      //   const position = new vscode.Position(line.lineNumber, indexOf);
      //   const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
      //   if (range) {
      //     // const command = {
      //     //   command = "workbench.action.terminal.sendSequence",
      //     //   title = line.text
      //     // };
      //     this.codeLenses.push(new vscode.CodeLens(range, {
      //       title: 'make',
      //       command: 'workbench.action.terminal.sendSequence',
      //       arguments: [{ text: "make " + line.text.split(":")[0] + "\u000D" }],
      //     }));
      //   }
      // }
      return this.codeLenses;
    }
    return [];
  }
  resolveCodeLens(codeLens, token) {
    if (vscode.workspace.getConfiguration("txtsyntax").get("enableCodeLens", true)) {
      codeLens.command = {
        title: "make",
        tooltip: "run make command for this target",
        command: "txtsyntax.codelensAction",
        arguments: ["hello", false]
      };
      return codeLens;
    }
    return null;
  }
}
exports.CodelensProvider = CodelensProvider;