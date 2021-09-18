# TXT Syntax

## Features

- Highlight syntax for several text files with dynamic enable/disable languages.
- Open the file under the current cursor through the right-click menu "Open File".
- Search selected word using custom search engine in the embeded simple browser.
- Simple folding and outline function.
- Add codelens for Makefile to make running makefile target easily.
- Highlight current line.
- Highlight multiple selected words in all active editors.
- Filter and focus on lines based on custom regular expressions

*folding function need you set `"editor.foldingStrategy": "auto"`.*

*highlight line feature is forked from [cliffordfajardo/highlight-line-vscode](https://github.com/cliffordfajardo/highlight-line-vscode)*

*highlight words feature is forked from [rsbondi/highlight-words](https://github.com/rsbondi/highlight-words)*

*filter lines feature is forked from [XinyaYang0506/log-analysis](https://github.com/XinyaYang0506/log-analysis)*

## Supported file types

#### default

The following type types are supported by default:

```
.txt
.text
.cf
.cnf
.conf
.cfg
.unx
.eds
.log
.ini
.out
.err
.inf
.info
.tmp
.temp
.file
.repo
.plain
.desktop
.properties
```

#### custom

you can enable/disable every file type(except txt/text type) by any of the following method:

```json
// with txtsyntax configuration
"txtsyntax.associations": [
  ".tmp",
  ".cnf",
  ".log",
  ".eds",
  ".aaa"
],
// or with vscode configuration
"files.associations": {
  "*.tmp": "txt",
  "*.cnf": "txt",
  "*.log": "txt",
  "*.eds": "txt",
  "*.aaa": "txt"
},
```

## Folding function

Text between sections, braces or hypertext markups could be folded.

Section headers like these:

```
-*-
* xxx
[xxx]
Part I.
Section A
Page 1
A. 
1. 
一 xx
甲. xxx
第一章 xxx
第2回 xxx
第 3 节 xxx
...
```

You could set `"files.defaultLanguage": "txt"` or `"files.associations": {"Untitled-*": "txt"}` in **settings.json** to let vscode treat all **Untitled files** as txt files and then txt syntax will be enabled for these files automatically.
In additon, you could also install [Modelines](https://marketplace.visualstudio.com/items?itemName=chrislajoie.vscode-modelines) extension to set a file to a special format.

**note**: It will override the default highlight schemes supported by visual studio code if you active this extension.
