const vscode = require('vscode');
const path = require("path");
const process = require('process');
const clp = require("./CodelensProvider");

// https://macromates.com/manual/en/language_grammars
// https://xshrim.visualstudio.com/_usersSettings/tokens

function selectTerminal() {
  if (vscode.window.terminals.length === 0) {
    var term = vscode.window.createTerminal();
    vscode.window.activeTerminal = term
    term.show(true);
    return term;
  } else if (vscode.window.activeTerminal === undefined) {
    var term = vscode.window.terminals[0];
    vscode.window.activeTerminal = term;
    term.show(true);
    return term;
  } else {
    vscode.window.activeTerminal.show(true);
    return vscode.window.activeTerminal;
  }
}

function revealLine(line) {
  var reviewType = vscode.TextEditorRevealType.InCenter;
  if (line === vscode.window.activeTextEditor.selection.active.line) {
    reviewType = vscode.TextEditorRevealType.InCenterIfOutsideViewport;
  }
  const newSe = new vscode.Selection(line, 0, line, 0);
  vscode.window.activeTextEditor.selection = newSe;
  vscode.window.activeTextEditor.revealRange(newSe, reviewType);
}

function revealPosition(line, column) {
  if (isNaN(column)) {
    revealLine(line);
  } else {
    var reviewType = vscode.TextEditorRevealType.InCenter;
    if (line === vscode.window.activeTextEditor.selection.active.line) {
      reviewType = vscode.TextEditorRevealType.InCenterIfOutsideViewport;
    }
    const newSe = new vscode.Selection(line, column, line, column);
    vscode.window.activeTextEditor.selection = newSe;
    vscode.window.activeTextEditor.revealRange(newSe, reviewType);
  }
}

async function activate(context) {
  const codelensProvider = new clp.CodelensProvider();
  vscode.languages.registerCodeLensProvider("makefile", codelensProvider);
  vscode.commands.registerCommand("txtsyntax.enableCodeLens", () => {
    vscode.workspace.getConfiguration("txtsyntax").update("enableCodeLens", true, true);
  });

  vscode.commands.registerCommand("txtsyntax.disableCodeLens", () => {
    vscode.workspace.getConfiguration("txtsyntax").update("enableCodeLens", false, true);
  });

  vscode.commands.registerCommand("txtsyntax.codelensAction", (args) => {
    vscode.window.showInformationMessage(`CodeLens action clicked with args=${args}`);
  });

  vscode.commands.registerCommand('txtsyntax.sendText', (args) => {
    var term = selectTerminal();
    term.sendText(args.text);
  });

  vscode.commands.registerCommand("txtsyntax.openit", (documentObj) => {
    // var f = vscode.Uri.file(documentObj.fsPath);
    var editor = vscode.window.activeTextEditor
    if (editor) {
      var range = editor.document.getWordRangeAtPosition(editor.selection.active, /(\.{0,2}|~)(\w:\\|file:\/\/\/|\/)[\w\.\/\-\=\+:@%&\(\)\<\>\[\]\{\}\\]*\.?\w*/g)
      //var text = editor.document.getText(editor.selection);
      var fpath = editor.document.getText(range)
      if (encodeURI(fpath).match(/%0A/g) || encodeURI(fpath).match(/\n/g) || fpath.indexOf(".") == 0) {
        fpath = editor.document.getText(editor.document.getWordRangeAtPosition(editor.selection.active, /\S+/g))
        var currentlyOpenTabfileDir = path.dirname(vscode.window.activeTextEditor.document.fileName)
        fpath = path.join(currentlyOpenTabfileDir, fpath)
      } else if (fpath.indexOf("~") == 0) {
        fpath = fpath.replace("~", process.env.HOME)
      } else if (fpath.indexOf("file:///") == 0) {
        fpath = fpath.replace("file:///", "/")
      }
      // while (fpath.indexOf("~") != 0 && fpath.indexOf("/") != 0 && fpath.indexOf(".") != 0 && fpath.indexOf(":") != 1) {}
      var f = vscode.Uri.file(fpath);
      vscode.workspace.openTextDocument(f).then(doc => {
        vscode.window.showTextDocument(doc).then(() => {
        })
      })
    }
    // var line = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection.active.line : undefined;
    // var column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
    // var selection = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.selection : undefined;
    // console.log(line, column, selection);
    // var f = vscode.Uri.file("README.md");
    // vscode.workspace.openTextDocument(f).then(doc => {
    //   vscode.window.showTextDocument(doc).then(() => {
    //     lineInt = parseInt(line, 10);
    //     columnInt = parseInt(column, 10);
    //     console.log(lineInt, columnInt);
    //     revealPosition(lineInt - 1, columnInt - 1);
    //   })
    // })
  });
  disposable = vscode.languages.registerFoldingRangeProvider('txt', {   //{ scheme: 'file', language: 'txt' }
    provideFoldingRanges(document, context, token) {
      // console.log('folding range invoked'); // comes here on every character edit
      let sectionStart = -1, BS = [], BP = new Array(), FR = [];
      let blre = /^[^\r\n\'\"]*\{/, brre = /^[^\r\n\'\"]*\}/;
      // let bpre = /^[^\S\r\n]*\<([^/\s]+)\>/, bqre = /^[^\S\r\n]*\<\/([^\s]+)\>/;
      let bpre = /<([^/\s]+)\>/, bqre = /\<\/([^\s]+)\>/;
      let re = /^-\*-|^\*[^\S\r\n]|^[A-Z0-9]+\.|^\[.+\]\s*|^(Section|SECTION|Chapter|CHAPTER|Sheet|SHEET|Season|SEASON|Period|PERIOD|Round|ROUND|Class|CLASS|Term|TERM|Part|PART|Page|PAGE|Segment|SEGMENT|Paragraph|PARAGRAPH|Lesson|LESSON|Region|REGION|Step|STEP|Level|LEVEL|Set|SET|Grade|GRADE|Year|YEAR|Month|MONTH|Week|WEEK|Day|DAY)[^\S\r\n][A-Z0-9]+\.?($|[^\S\r\n])|^(第[^\S\r\n]|第)?[一二三四五六七八九十百千万亿兆零壹贰叁肆伍陆柒捌玖拾佰仟甲乙丙丁戊已庚辛壬癸子丑寅卯辰已午未申酉戍亥]+($|[^\S\r\n])?[章节篇部回课页段组卷区季级集步年月周天轮个项类]?($|[\.、]|[^\S\r\n])|^(第[^\S\r\n]|第)?[0123456789]+[^\S\r\n]?([章节篇部回课页段组卷区季级集步年月周天轮个项类]?[\.、]|[章节篇部回课页段组卷区季级集步年月周天轮个项类][^\S\r\n])/;  // regex to detect start of region

      for (let i = 0; i < document.lineCount; i++) {
        if (blre.test(document.lineAt(i).text)) {
          BS.push(i);
        } else if (brre.test(document.lineAt(i).text) && BS.length > 0) {
          bstart = BS.pop();
          FR.push(new vscode.FoldingRange(bstart, i, vscode.FoldingRangeKind.Region));
        } else if (bpre.test(document.lineAt(i).text)) {
          let item = bpre.exec(document.lineAt(i).text)[1];
          if (BP[item] == undefined) {
            BP[item] = [];
          }
          BP[item].push(i);
        } else if (bqre.test(document.lineAt(i).text)) {
          let item = bqre.exec(document.lineAt(i).text)[1];
          if (BP[item] != undefined && BP[item].length > 0) {
            pstart = BP[item].pop();
            FR.push(new vscode.FoldingRange(pstart, i, vscode.FoldingRangeKind.Region));
          }
        }

        if (re.test(document.lineAt(i).text)) {
          if (sectionStart >= 0 && i > 0) {
            FR.push(new vscode.FoldingRange(sectionStart, i - 1, vscode.FoldingRangeKind.Region));
          }
          sectionStart = i;
        }
      }
      if (sectionStart >= 0) { FR.push(new vscode.FoldingRange(sectionStart, document.lineCount - 1, vscode.FoldingRangeKind.Region)); }
      return FR;
    }
  });
}

exports.activate = activate;

module.exports = {
  activate
}
