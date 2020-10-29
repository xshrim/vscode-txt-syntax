'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class HighlightConfig {
  static getConfigValues() {
    let config = vscode.workspace.getConfiguration('txtsyntax');
    let colors = config.get('highlightColors');
    let box = config.get('highlightBox');
    const defaultMode = config.get('defaultHighlightMode');
    const showSidebar = config.get('showHighlightSidebar');
    let decorators = [];
    colors.forEach(function (color) {
      var dark = {
        // this color will be used in dark color themes
        overviewRulerColor: color.dark,
        backgroundColor: box.dark ? 'inherit' : color.dark,
        borderColor: color.dark
      };
      if (!box.dark)
        dark.color = '#555555';
      let decorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '2px',
        borderStyle: 'solid',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
          // this color will be used in light color themes
          overviewRulerColor: color.light,
          borderColor: color.light,
          backgroundColor: box.light ? 'inherit' : color.light
        },
        dark: dark
      });
      decorators.push(decorationType);
    });
    return { decorators, defaultMode, showSidebar };
  }
}
exports.default = HighlightConfig;