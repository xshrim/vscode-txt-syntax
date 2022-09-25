const vscode = require('vscode');
const hlconfig = require("./hlconfig");
const path = require("path");
const process = require('process');
const clp = require("./codelensProvider");
const dsp = require("./documentSymbolProvider");
const hl = require("./highlight");
const utils = require("./utils");
const filterCommands = require("./filterCommands");
const focusProvider = require("./focusProvider");
const filterTreeViewProvider = require("./filterTreeViewProvider");
const { deepStrictEqual } = require('assert');

// https://macromates.com/manual/en/language_grammars
// https://xshrim.visualstudio.com/_usersSettings/tokens
// https://code.visualstudio.com/api/references/icons-in-labels

//GLOBAL to be used for activate and deactivate
let storageUri;

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
  const config = vscode.workspace.getConfiguration("txtsyntax");
  /////////////// outline
  const documentSymbolProvider = new dsp.DocumentSymbolProvider();
  context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider("txt", documentSymbolProvider)); // { scheme: "file", language: "txt" }

  /////////////// codelens
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

  /////////////// custom file associations
  let associations = config.get("associations");
  if (associations.length > 0) {
    vscode.window.visibleTextEditors.forEach(editor => {
      if (editor === undefined || editor.document === undefined || editor.document.isClosed) {
        return
      };

      let fileExt = path.extname(editor.document.fileName).toLowerCase();
      if (fileExt == "") {
        return
      };

      if (associations.includes(fileExt)) {
        vscode.languages.setTextDocumentLanguage(editor.document, "txt");
      };
    });
  };

  vscode.workspace.onDidOpenTextDocument((doc) => {
    if (associations.length < 1 || doc === undefined || doc.isClosed) {
      return
    };

    let fileExt = path.extname(doc.fileName).toLowerCase();
    if (fileExt == "") {
      return
    };

    if (associations.includes(fileExt)) {
      vscode.languages.setTextDocumentLanguage(doc, "txt");
    };
  });

  // vscode.window.onDidChangeActiveTextEditor((editor) => {
  //   if (editor === undefined || editor.document === undefined || editor.document.isClosed) {
  //     return
  //   };

  //   let fileExt = path.extname(editor.document.fileName).toLowerCase();
  //   if (fileExt == "") {
  //     return
  //   };
  //   console.log("========", fileExt)

  //   if (associations.includes(fileExt)) {
  //     vscode.languages.setTextDocumentLanguage(editor.document, "txt");
  //   }
  // });

  /////////////// highlight line
  if (config.get("enableHighlightLine", true)) {
    let decorationType = getDecorationTypeFromConfig();
    let activeEditor = vscode.window.activeTextEditor;
    let lastActivePosition;

    vscode.window.onDidChangeActiveTextEditor(() => {
      try {
        activeEditor = vscode.window.activeTextEditor
        updateDecorations(decorationType)
      } catch (error) {
        console.error("Error from ' window.onDidChangeActiveTextEditor' -->", error)
      } finally {
        if (activeEditor !== undefined) {
          lastActivePosition = new vscode.Position(activeEditor.selection.active.line, activeEditor.selection.active.character);
        }
      }
    })

    vscode.window.onDidChangeTextEditorSelection(() => {
      activeEditor = vscode.window.activeTextEditor;
      updateDecorations(decorationType);
    })

    vscode.workspace.onDidChangeConfiguration(() => {
      //clear all decorations
      decorationType.dispose();
      decorationType = getDecorationTypeFromConfig();
      updateDecorations(decorationType, true)
    })

    function getDecorationTypeFromConfig() {
      const borderColor = config.get("highlightLineBorderColor");
      const borderWidth = config.get("highlightLineBorderWidth");
      const borderStyle = config.get("highlightLineBorderStyle");
      const decorationType = vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        borderWidth: `0 0 ${borderWidth} 0`,
        borderStyle: `${borderStyle}`, //TODO: file bug, this shouldn't throw a lint error.
        borderColor
      })
      return decorationType;
    }

    function updateDecorations(decorationType, updateAllVisibleEditors = false) {
      try {
        if (updateAllVisibleEditors) {
          vscode.window.visibleTextEditors.forEach((editor) => {
            const currentPosition = editor.selection.active;
            const currentLine = editor.selection.active.line;
            const newDecoration = { range: new vscode.Range(currentPosition, currentPosition) };
            editor.setDecorations(decorationType, [newDecoration]);
          });
        }

        //edit only currently active editor
        else {
          vscode.window.visibleTextEditors.forEach((editor) => {
            if (editor !== vscode.window.activeTextEditor) return;

            const currentPosition = editor.selection.active
            const newDecoration = { range: new vscode.Range(currentPosition, currentPosition) }

            if (lastActivePosition === undefined) {
              editor.setDecorations(decorationType, [newDecoration])
            } else {
              const editorHasChangedLines = lastActivePosition.line !== currentPosition.line
              const isNewEditor = activeEditor.document.lineCount === 1 && lastActivePosition.line === 0 && lastActivePosition.character == 0;
              if (editorHasChangedLines || isNewEditor) {
                editor.setDecorations(decorationType, [newDecoration])
              }
            }
          });
        }
      }
      catch (error) {
        console.error("Error from ' updateDecorations' -->", error)
      } finally {
        if (activeEditor !== undefined) {
          lastActivePosition = new vscode.Position(activeEditor.selection.active.line, activeEditor.selection.active.character);
        }
      }
    }
  };

  ////////////// highlight words
  let highlight = new hl.default();
  let configValues;
  vscode.commands.registerCommand('txtsyntax.toggleRegExpHighlight', function () {
    vscode.window.showInputBox({ prompt: 'Enter expression' })
      .then(word => {
        highlight.toggleRegExp(word);
      });
  });
  vscode.commands.registerCommand('txtsyntax.toggleHighlight', function () {
    highlight.toggleSelected();
  });
  vscode.commands.registerCommand('txtsyntax.toggleHighlightWithOptions', function () {
    highlight.toggleSelected(true);
  });
  vscode.commands.registerCommand('txtsyntax.removeHighlight', function () {
    vscode.window.showQuickPick(highlight.getWords().concat([{ expression: '* All *', wholeWord: false, ignoreCase: false }]).map(w => {
      return {
        label: w.expression,
        description: (w.ignoreCase ? 'i' : '') + (w.wholeWord ? 'w' : ''),
        detail: ''
      };
    }))
      .then(word => {
        highlight.remove(word);
      });
  });
  vscode.commands.registerCommand('txtsyntax.treeRemoveHighlight', e => {
    highlight.remove(e);
  });
  vscode.commands.registerCommand('txtsyntax.treeHighlightOptions', e => {
    highlight.updateOptions(e.label);
  });
  vscode.commands.registerCommand('txtsyntax.cleanHighlights', function () {
    highlight.clearAll();
  });
  vscode.commands.registerCommand('txtsyntax.toggleSidebar', function () {
    configValues.showSidebar = !configValues.showSidebar;
    vscode.commands.executeCommand('setContext', 'showSidebar', configValues.showSidebar);
  });
  vscode.commands.registerCommand('txtsyntax.setHighlightMode', function () {
    const modes = ['Default', 'Whole Word', 'Ignore Case', 'Both'].map((s, i) => highlight.getMode() == i ? s + ' ✅' : s);
    vscode.window.showQuickPick(modes).then(option => {
      if (typeof option === 'undefined')
        return;
      highlight.setMode(modes.indexOf(option));
    });
  });
  function next(e, wrap) {
    const doc = vscode.window.activeTextEditor.document;
    const ed = vscode.window.activeTextEditor;
    const offset = wrap ? 0 : doc.offsetAt(ed.selection.active);
    const nextStart = wrap ? 0 : 1;
    const text = doc.getText();
    const slice = text.slice(offset + nextStart);
    const opts = e.highlight.ignoreCase ? 'i' : '';
    const expression = e.highlight.wholeWord ? '\\b' + e.highlight.expression + '\\b' : e.highlight.expression;
    const re = new RegExp(expression, opts);
    const pos = slice.search(re);
    if (pos == -1) {
      if (!wrap) {
        next(e, true);
      } // wrap
      else
        highlight.getLocationIndex(e.highlight.expression, new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 1)));
      return;
    }
    const word = slice.match(re);
    const start = doc.positionAt(pos + offset + nextStart);
    const end = new vscode.Position(start.line, start.character + word[0].length);
    const range = new vscode.Range(start, end);
    vscode.window.activeTextEditor.revealRange(range);
    vscode.window.activeTextEditor.selection = new vscode.Selection(start, start);
    highlight.getLocationIndex(e.highlight.expression, range);
  }
  vscode.commands.registerCommand('txtsyntax.findNext', e => {
    next(e);
  });
  function prev(e, wrap) {
    const doc = vscode.window.activeTextEditor.document;
    const ed = vscode.window.activeTextEditor;
    const iAmHere = ed.selection.active;
    const offset = doc.offsetAt(iAmHere);
    const text = doc.getText();
    const slice = text.slice(0, offset);
    const opts = e.highlight.ignoreCase ? 'gi' : 'g';
    const expression = e.highlight.wholeWord ? '\\b' + e.highlight.expression + '\\b' : e.highlight.expression;
    const re = new RegExp(expression, opts);
    const pos = slice.search(re);
    if (pos == -1) {
      if (!wrap) {
        if (offset != 0) {
          const home = doc.positionAt(text.length - 1);
          vscode.window.activeTextEditor.selection = new vscode.Selection(home, home);
          prev(e, true);
          return;
        }
      }
      else
        highlight.getLocationIndex(e.highlight.expression, new vscode.Range(new vscode.Position(1, 1), new vscode.Position(1, 1)));
    }
    let word;
    let found;
    let index;
    while ((found = re.exec(slice)) !== null) {
      index = re.lastIndex;
      word = found[0];
      //console.log('last index', index);
    }
    const start = doc.positionAt(index - word.length);
    const range = new vscode.Range(start, start);
    vscode.window.activeTextEditor.revealRange(range);
    vscode.window.activeTextEditor.selection = new vscode.Selection(start, start);
    highlight.getLocationIndex(e.highlight.expression, range);
  }
  vscode.commands.registerCommand('txtsyntax.findPrevious', e => {
    prev(e);
  });
  updateConfig();
  function updateConfig() {
    associations = vscode.workspace.getConfiguration("txtsyntax").get("associations");
    configValues = hlconfig.default.getConfigValues();
    highlight.setDecorators(configValues.decorators);
    highlight.setMode(configValues.defaultMode);
    vscode.commands.executeCommand('setContext', 'showSidebar', configValues.showSidebar);
  }
  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor) {
    triggerUpdateDecorations();
  }
  vscode.workspace.onDidChangeConfiguration(() => {
    updateConfig();
  });
  vscode.window.onDidChangeVisibleTextEditors(function (editor) {
    highlight.updateDecorations();
  }, null, context.subscriptions);
  vscode.workspace.onDidChangeTextDocument(function (event) {
    activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && event.document === activeEditor.document) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);
  var timeout = null;
  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      highlight.updateActive();
    }, 500);
  };

  ////////////// filter lines
  storageUri = context.globalStorageUri; //get the store path
  utils.cleanUpIconFiles(storageUri); //clean up the old icon files
  const filterArr = [];
  const state = {
    inFocusMode: false,
    filterArr,
    decorations: [],
    disposableFoldingRange: null,
    filterTreeViewProvider: new filterTreeViewProvider.FilterTreeViewProvider(filterArr),
    focusProvider: new focusProvider.FocusProvider(filterArr),
    storageUri
  };
  //tell vs code to open focus:... uris with state.focusProvider
  vscode.workspace.registerTextDocumentContentProvider('focus', state.focusProvider);
  //register filterTreeViewProvider under id 'filters' which gets attached
  //to the file explorer according to package.json's contributes>views>explorer
  vscode.window.registerTreeDataProvider('filters', state.filterTreeViewProvider);
  //Add events listener
  var disposableOnDidChangeVisibleTextEditors = vscode.window.onDidChangeVisibleTextEditors(event => {
    filterCommands.refreshEditors(state);
  });
  context.subscriptions.push(disposableOnDidChangeVisibleTextEditors);
  var disposableOnDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
    filterCommands.refreshEditors(state);
  });
  context.subscriptions.push(disposableOnDidChangeTextDocument);
  var disposableOnDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(event => {
    //update the filter counts for the current activate editor
    filterCommands.applyHighlight(state, vscode.window.visibleTextEditors);
    state.filterTreeViewProvider.refresh();
  });
  context.subscriptions.push(disposableOnDidChangeActiveTextEditor);
  //register commands
  let disposableExport = vscode.commands.registerCommand("txtsyntax.exportFilters", () => filterCommands.exportFilters(state));
  context.subscriptions.push(disposableExport);
  let disposableImport = vscode.commands.registerCommand("txtsyntax.importFilters", () => filterCommands.importFilters(state));
  context.subscriptions.push(disposableImport);
  let disposableEnableVisibility = vscode.commands.registerCommand("txtsyntax.enableVisibility", (filterTreeItem) => filterCommands.setVisibility(true, filterTreeItem, state));
  context.subscriptions.push(disposableEnableVisibility);
  let disposableDisableVisibility = vscode.commands.registerCommand("txtsyntax.disableVisibility", (filterTreeItem) => filterCommands.setVisibility(false, filterTreeItem, state));
  context.subscriptions.push(disposableDisableVisibility);
  let disposableToggleFocusMode = vscode.commands.registerCommand("txtsyntax.toggleFocusMode", () => filterCommands.toggleFocusMode(state));
  context.subscriptions.push(disposableToggleFocusMode);
  let disposibleAddFilter = vscode.commands.registerCommand("txtsyntax.addFilter", () => filterCommands.addFilter(state));
  context.subscriptions.push(disposibleAddFilter);
  let disposibleEditFilter = vscode.commands.registerCommand("txtsyntax.editFilter", (filterTreeItem) => filterCommands.editFilter(filterTreeItem, state));
  context.subscriptions.push(disposibleEditFilter);
  let disposibleDeleteFilter = vscode.commands.registerCommand("txtsyntax.deleteFilter", (filterTreeItem) => filterCommands.deleteFilter(filterTreeItem, state));
  context.subscriptions.push(disposibleDeleteFilter);
  let disposibleEnableHighlight = vscode.commands.registerCommand("txtsyntax.enableHighlight", (filterTreeItem) => filterCommands.setHighlight(true, filterTreeItem, state));
  context.subscriptions.push(disposibleEnableHighlight);
  let disposibleDisableHighlight = vscode.commands.registerCommand("txtsyntax.disableHighlight", (filterTreeItem) => filterCommands.setHighlight(false, filterTreeItem, state));
  context.subscriptions.push(disposibleDisableHighlight);

  ////////////// open codelf
  vscode.commands.registerCommand("txtsyntax.searchit", (documentObj) => {
    // var f = vscode.Uri.file(documentObj.fsPath);
    var editor = vscode.window.activeTextEditor
    if (editor) {
      var keyword = editor.document.getText(editor.selection);
      if (!keyword) {
        const range = editor.document.getWordRangeAtPosition(editor.selection.start);
        if (range) {
          keyword = editor.document.getText(range);
        }
      }
      if (keyword) {
        let searchlink = vscode.workspace.getConfiguration("txtsyntax").get("searchlink");
        if (!searchlink) {
          searchlink = "https://www.google.com/search?q={{keyword}}";
        }
        searchlink = searchlink.replace(/{{keyword}}/g, keyword);
        // var searchlink = `https://unbug.github.io/codelf/#${keyword}`
        vscode.commands.executeCommand("simpleBrowser.show", searchlink);
      }
    }
  });

  ////////////// open file
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

  ////////////// txt syntax
  disposable = vscode.languages.registerFoldingRangeProvider('txt', {   //{ scheme: 'file', language: 'txt' }
    provideFoldingRanges(document, context, token) {
      // console.log('folding range invoked'); // comes here on every character edit
      let sectionStart = -1, CodeBlocks = [], HtmlBlocks = new Array(), FoldingRanges = [];
      let codeBlockLeftRegex = /^[^\r\n]*\{/, codeBlockRightRegex = /^[^\r\n]*\}/, codeBlockMiddleRegex = /^[^\r\n]*\}[^\r\n]*\{/;
      // let htmlBlockStartRegex = /^[^\S\r\n]*\<([^/\s]+)\>/, htmlBlockEndRegex = /^[^\S\r\n]*\<\/([^\s]+)\>/;
      let htmlBlockStartRegex = /<([^/\s]+)\s*.*\>/, htmlBlockEndRegex = /\<\/([^\s]+)\>/;
      let re = /^-\*-|^\*[^\S\r\n]|^[A-Z0-9]+\.\s|^\[.+\]\s*|^(Section|SECTION|Chapter|CHAPTER|Sheet|SHEET|Season|SEASON|Period|PERIOD|Round|ROUND|Class|CLASS|Term|TERM|Part|PART|Page|PAGE|Segment|SEGMENT|Paragraph|PARAGRAPH|Lesson|LESSON|Region|REGION|Step|STEP|Level|LEVEL|Set|SET|Grade|GRADE|Year|YEAR|Month|MONTH|Week|WEEK|Day|DAY)[^\S\r\n][A-Z0-9]+\.?($|[^\S\r\n])|^(第[^\S\r\n]|第)?[一二三四五六七八九十百千万亿兆零壹贰叁肆伍陆柒捌玖拾佰仟甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]+($|[^\S\r\n])?[章节篇部首回手课页段组卷区场合季级集任步条件年月日周天轮个项类期话例]?($|[\.、]|[^\S\r\n])|^(第[^\S\r\n]|第)?[0123456789]+[^\S\r\n]?[章节篇部首回手课页段组卷区场合季级集任步条件年月日周天轮个项类期话例]($|[\.、]|[^\S\r\n])|^(第[^\S\r\n]|第)[0123456789]+($|[\.、]|[^\S\r\n])/;  // regex to detect start of region

      for (let i = 0; i < document.lineCount; i++) {
        let line = document.lineAt(i).text;
        if (codeBlockLeftRegex.test(line) && !codeBlockMiddleRegex.test(line)) {
          let tmp = /^[^\r\n]*\{[^\r\n]*\}/;
          if (!tmp.test(line)) {
            CodeBlocks.push(i);
          }
        } else if (codeBlockRightRegex.test(line) && CodeBlocks.length > 0) {
          codeBlockStart = CodeBlocks.pop();
          FoldingRanges.push(new vscode.FoldingRange(codeBlockStart, i - 1, vscode.FoldingRangeKind.Region));
          if (codeBlockMiddleRegex.test(line)) {
            CodeBlocks.push(i);
          }
        } else if (htmlBlockStartRegex.test(line)) {
          let item = htmlBlockStartRegex.exec(line)[1];
          if (HtmlBlocks[item] == undefined) {
            HtmlBlocks[item] = [];
          }
          HtmlBlocks[item].push(i);
        } else if (htmlBlockEndRegex.test(line)) {
          let item = htmlBlockEndRegex.exec(line)[1];
          if (HtmlBlocks[item] != undefined && HtmlBlocks[item].length > 0) {
            htmlBlockStart = HtmlBlocks[item].pop();
            FoldingRanges.push(new vscode.FoldingRange(htmlBlockStart, i - 1, vscode.FoldingRangeKind.Region));
          }
        }

        if (re.test(line)) {
          if (sectionStart >= 0 && i > 0) {
            FoldingRanges.push(new vscode.FoldingRange(sectionStart, i - 1, vscode.FoldingRangeKind.Region));
          }
          sectionStart = i;
        }
      }
      if (sectionStart >= 0) { FoldingRanges.push(new vscode.FoldingRange(sectionStart, document.lineCount - 1, vscode.FoldingRangeKind.Region)); }
      return FoldingRanges;
    }
  });
}

function deactivate() {
  utils.cleanUpIconFiles(storageUri);
}

exports.activate = activate;
exports.deactivate = deactivate;

module.exports = {
  activate
}
