const vscode = require('vscode');

async function activate(context) {
  disposable = vscode.languages.registerFoldingRangeProvider('txt', {   //{ scheme: 'file', language: 'txt' }
    provideFoldingRanges(document, context, token) {
      // console.log('folding range invoked'); // comes here on every character edit
      let sectionStart = 0, FR = [], re = /^-\*-|^\=[^\S\r\n]|^[A-Z0-9]+\.\s|^\[.+\]\s*|^(Section|SECTION|Chapter|CHAPTER|Sheet|SHEET|Season|SEASON|Period|PERIOD|Round|ROUND|Class|CLASS|Term|TERM|Part|PART|Page|PAGE|Segment|SEGMENT|Paragraph|PARAGRAPH|Lesson|LESSON|Region|REGION|Step|STEP|Level|LEVEL|Set|SET|Grade|GRADE|Year|YEAR|Month|MONTH|Week|WEEK|Day|DAY)[^\S\r\n][A-Z0-9]+\.?($|[^\S\r\n])|^(第[^\S\r\n]|第)?[一二三四五六七八九十百千万亿兆零壹贰叁肆伍陆柒捌玖拾佰仟甲乙丙丁戊已庚辛壬癸子丑寅卯辰已午未申酉戍亥]+($|[^\S\r\n])?[章节篇部课页段组卷区季级集步年月周天轮项类]?($|[\.、]|[^\S\r\n])|^(第[^\S\r\n]|第)?[0123456789]+[^\S\r\n]?([章节篇部课页段组卷区季级集步年月周天轮项类]?[\.、]|[章节篇部课页段组卷区季级集步年月周天轮项类][^\S\r\n])/;  // regex to detect start of region

      for (let i = 0; i < document.lineCount; i++) {

        if (re.test(document.lineAt(i).text)) {
          if (sectionStart > 0) {
            FR.push(new vscode.FoldingRange(sectionStart, i - 1, vscode.FoldingRangeKind.Region));
          }
          sectionStart = i;
        }
      }
      if (sectionStart > 0) { FR.push(new vscode.FoldingRange(sectionStart, document.lineCount - 1, vscode.FoldingRangeKind.Region)); }

      return FR;
    }
  });
}

exports.activate = activate;

module.exports = {
  activate
}
