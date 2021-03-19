"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterItem = exports.FilterTreeViewProvider = void 0;
const vscode = require("vscode");
//provides filters as tree items to be displayed on the sidebar
class FilterTreeViewProvider {
  constructor(filterArr) {
    this.filterArr = filterArr;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }
  getTreeItem(element) {
    return element;
  }
  //getChildren(filterItem) returns empty list because filters have no children.
  //getChildren() returns the root elements (all the filters)
  getChildren(element) {
    if (element) {
      return [];
    }
    else { // root
      return this.filterArr.map(filter => new FilterItem(filter));
    }
  }
  refresh() {
    // console.log("in refresh");
    this._onDidChangeTreeData.fire(undefined);
  }
}
exports.FilterTreeViewProvider = FilterTreeViewProvider;
//represents a filter as one row in the sidebar
class FilterItem extends vscode.TreeItem {
  constructor(filter) {
    super(filter.regex.toString());
    this.label = filter.regex.toString();
    this.id = filter.id;
    this.iconPath = filter.iconPath;
    if (filter.isHighlighted) {
      if (filter.isShown) {
        this.description = ` · ${filter.count}`;
        this.contextValue = 'lit-visible';
      }
      else {
        this.description = '';
        this.contextValue = 'lit-invisible';
      }
    }
    else {
      this.description = '';
      if (filter.isShown) {
        this.contextValue = 'unlit-visible';
      }
      else {
        this.contextValue = 'unlit-invisible';
      }
    }
  }
}
exports.FilterItem = FilterItem;
//# sourceMappingURL=filterTreeViewProvider.js.map