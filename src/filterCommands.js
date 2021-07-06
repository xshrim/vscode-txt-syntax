"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshEditors = exports.setHighlight = exports.editFilter = exports.addFilter = exports.deleteFilter = exports.toggleFocusMode = exports.setVisibility = exports.importFilters = exports.exportFilters = exports.applyHighlight = void 0;
const vscode = require("vscode");
const utils = require("./utils");
function applyHighlight(state, editors) {
  // remove old decorations from all the text editor using the given decorationType
  state.decorations.forEach(decorationType => decorationType.dispose());
  state.decorations = [];
  editors.forEach((editor) => {
    let sourceCode = editor.document.getText();
    const sourceCodeArr = sourceCode.split("\n");
    //apply new decorations
    state.filterArr.forEach((filter) => {
      let filterCount = 0;
      //if filter's highlight is off, or this editor is in focus mode and filter is not shown, we don't want to put decorations
      //especially when a specific line fits more than one filter regex and some of them are shown while others are not. 
      if (filter.isHighlighted && (!editor.document.uri.toString().startsWith('focus:') || filter.isShown)) {
        let lineNumbers = [];
        for (let lineIdx = 0; lineIdx < sourceCodeArr.length; lineIdx++) {
          if (filter.regex.test(sourceCodeArr[lineIdx])) {
            lineNumbers.push(lineIdx);
          }
        }
        filterCount = lineNumbers.length;
        const decorationsArray = lineNumbers.map((lineIdx) => {
          return new vscode.Range(new vscode.Position(lineIdx, 0), new vscode.Position(lineIdx, 0) //position does not matter because isWholeLine is set to true
          );
        });
        let decorationType = vscode.window.createTextEditorDecorationType({
          backgroundColor: filter.color,
          isWholeLine: true,
        });
        //store the decoration type for future removal
        state.decorations.push(decorationType);
        editor.setDecorations(decorationType, decorationsArray);
      }
      //filter.count represents the count of the lines for the activeEditor, so if the current editor is active, we update the count
      if (editor === vscode.window.activeTextEditor) {
        filter.count = filterCount;
      }
    });
  });
}
exports.applyHighlight = applyHighlight;

function regexFromString(string) {
  var match = /^\/(.*)\/([a-z]*)$/.exec(string)
  if (match !== null) {
    return new RegExp(match[1], match[2])
  } else {
    return new RegExp(string)
  }
}

//record the important fields of each filter on a json object and open a new tab for the json
function exportFilters(state) {
  const content = JSON.stringify(state.filterArr.map(filter => {
    return {
      regexText: filter.regex.source,
      color: filter.color,
      isHighlighted: filter.isHighlighted,
      isShown: filter.isShown,
    };
  }));
  vscode.workspace.openTextDocument({
    content: content,
    language: "json"
  });
}
exports.exportFilters = exportFilters;
//open a selected json file and parse each filter to add back
function importFilters(state) {
  vscode.window.showOpenDialog({
    canSelectFiles: true,
    canSelectMany: false,
    filters: {
      "json": ["json"]
    }
  }).then(uriArr => {
    if (!uriArr) {
      return;
    }
    return vscode.workspace.openTextDocument(uriArr[0]);
  }).then(textDocument => {
    const text = textDocument.getText();
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object") {
      return;
    }
    const array = parsed;
    array.forEach((filterText) => {
      if ((typeof filterText.regexText === "string") &&
        (typeof filterText.color === "string") &&
        (typeof filterText.isHighlighted === "boolean") &&
        (typeof filterText.isShown === "boolean")) {
        const id = `${Math.random()}`;
        const filter = {
          regex: regexFromString(filterText.regexText),
          color: filterText.color,
          isHighlighted: filterText.isHighlighted,
          isShown: filterText.isShown,
          id,
          iconPath: utils.generateSvgUri(state.storageUri, id, filterText.isHighlighted),
          count: 0
        };
        state.filterArr.push(filter);
        utils.writeSvgContent(filter, state.filterTreeViewProvider);
      }
    });
    refreshEditors(state);
  });
}
exports.importFilters = importFilters;
//set bool for whether the lines matched the given filter will be kept for focus mode
function setVisibility(isShown, filterTreeItem, state) {
  const id = filterTreeItem.id;
  const filter = state.filterArr.find(filter => (filter.id === id));
  filter.isShown = isShown;
  refreshEditors(state);
}
exports.setVisibility = setVisibility;
//turn on focus mode for the active editor. Will create a new tab if not already for the virtual document
function toggleFocusMode(state) {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  let escapedUri = editor.document.uri.toString();
  if (escapedUri.startsWith('focus:')) {
    state.focusProvider.switchFocus();
    refreshEditors(state);
    // //avoid creating nested focus mode documents
    // vscode.window.showInformationMessage('You are on focus mode virtual document already!');
    // return;
  }
  else {
    state.focusProvider.focusOn = true;
    //set special schema
    let virtualUri = vscode.Uri.parse('focus:' + escapedUri);
    //because of the special schema, openTextDocument will use the focusProvider
    vscode.workspace.openTextDocument(virtualUri).then(doc => vscode.window.showTextDocument(doc));
  }
}
exports.toggleFocusMode = toggleFocusMode;
function deleteFilter(filterTreeItem, state) {
  const deleteIndex = state.filterArr.findIndex(filter => (filter.id === filterTreeItem.id));
  state.filterArr.splice(deleteIndex, 1);
  refreshEditors(state);
}
exports.deleteFilter = deleteFilter;
function addFilter(state) {
  vscode.window.showInputBox({
    prompt: "Type a regex to filter",
    ignoreFocusOut: false
  }).then(regexStr => {
    if (regexStr === undefined) {
      return;
    }
    const id = `${Math.random()}`;
    const filter = {
      isHighlighted: true,
      isShown: true,
      regex: regexFromString(regexStr),
      color: utils.generateRandomColor(),
      id,
      iconPath: utils.generateSvgUri(state.storageUri, id, true),
      count: 0
    };
    state.filterArr.push(filter);
    //the order of the following two lines is deliberate (due to some unknown reason of async dependencies...)
    utils.writeSvgContent(filter, state.filterTreeViewProvider);
    refreshEditors(state);
  });
}
exports.addFilter = addFilter;
function editFilter(filterTreeItem, state) {
  vscode.window.showInputBox({
    prompt: "Type a new regex",
    ignoreFocusOut: false
  }).then(regexStr => {
    if (regexStr === undefined) {
      return;
    }
    const id = filterTreeItem.id;
    const filter = state.filterArr.find(filter => (filter.id === id));
    filter.regex = regexFromString(regexStr);
    refreshEditors(state);
  });
}
exports.editFilter = editFilter;
function setHighlight(isHighlighted, filterTreeItem, state) {
  const id = filterTreeItem.id;
  const filter = state.filterArr.find(filter => (filter.id === id));
  filter.isHighlighted = isHighlighted;
  filter.iconPath = utils.generateSvgUri(state.storageUri, filter.id, filter.isHighlighted);
  applyHighlight(state, vscode.window.visibleTextEditors);
  utils.writeSvgContent(filter, state.filterTreeViewProvider);
}
exports.setHighlight = setHighlight;
//refresh every visible component, including: 
//document content of the visible focus mode virtual document,
//decoration of the visible focus mode virtual document, 
//highlight decoration of visible editors
//treeview on the side bar
let focusDecorationType = vscode.window.createTextEditorDecorationType({
  before: {
    contentText: ">>>>>>>focus mode<<<<<<<",
    color: "#888888",
  }
});

function refreshEditors(state) {
  vscode.window.visibleTextEditors.forEach(editor => {
    let escapedUri = editor.document.uri.toString();
    if (escapedUri.startsWith('focus:')) {
      state.focusProvider.refresh(editor.document.uri);
      let focusDecorationRangeArray = [new vscode.Range(new vscode.Position(0, 0), new vscode.Position(1, 0))];
      //focusDecorationType.dispose();
      //editor.setDecorations(focusDecorationType, []);
      editor.setDecorations(focusDecorationType, focusDecorationRangeArray);
    }
  });
  applyHighlight(state, vscode.window.visibleTextEditors);
  //console.log("refreshEditors");
  state.filterTreeViewProvider.refresh();
}
exports.refreshEditors = refreshEditors;
//# sourceMappingURL=commands.js.map