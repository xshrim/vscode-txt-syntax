"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSvgUri = exports.writeSvgContent = exports.cleanUpIconFiles = exports.generateRandomColor = void 0;
const vscode = require("vscode");
function generateRandomColor() {
  return `hsl(${Math.floor(360 * Math.random())}, 40%, 40%)`;
}
exports.generateRandomColor = generateRandomColor;
//clean up the generated svgs stored in the folder created for this extension
function cleanUpIconFiles(storageUri) {
  vscode.workspace.fs.delete(storageUri, {
    recursive: true,
    useTrash: false
  }).then(undefined, (err) => {
    if (err.name !== "EntryNotFound (FileSystemError)") throw err;
  });
}
exports.cleanUpIconFiles = cleanUpIconFiles;
//create an svg icon representing a filter: a filled circle if the filter is highlighted, or an empty circle otherwise.
//this icon gets stored in the file system at filter.iconPath.
function writeSvgContent(filter, treeViewProvider) {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle fill="${filter.color}" cx="50" cy="50" r="50"/></svg>`;
  const emptySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle stroke="${filter.color}" fill="transparent" stroke-width="10" cx="50" cy="50" r="45"/></svg>`;
  vscode.workspace.fs.writeFile(filter.iconPath, str2Uint8(filter.isHighlighted ? fullSvg : emptySvg)).then(() => {
    //console.log("before refresh");
    //console.log(filter.iconPath);
    treeViewProvider.refresh();
  });
}
exports.writeSvgContent = writeSvgContent;
//convert a string to a Uint8Array
function str2Uint8(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf); //TODO: check if can just use str.length
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}
function generateSvgUri(storageUri, id, isHighlighted) {
  return vscode.Uri.joinPath(storageUri, `./${id}${isHighlighted}.svg`);
}
exports.generateSvgUri = generateSvgUri;
//# sourceMappingURL=utils.js.map