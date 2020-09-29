Txt Syntax extension is aimed to highlight several text files.

Txt Syntax also supports simple folding function, text between sections, braces or hypertext markups could be folded.

*folding function need you set `"editor.foldingStrategy": "auto"`.*

Supported file types:

```
.text
.txt
.cf
.cnf
.conf
.log
.cfg
.ini
.out
.tmp
.temp
.file
.properties
````

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
甲、xxx
第一章 xxx
第 3 节 xxx
...
```

You could set `"files.defaultLanguage": "txt"` or `"files.associations": {"Untitled-*": "txt"}` in **settings.json** to let vscode treat all **Untitled files** as txt files and then txt syntax will be enabled for these files automatically. In additon, you could also install [Modelines](https://marketplace.visualstudio.com/items?itemName=chrislajoie.vscode-modelines) extension to set a file to  a special format.

**note**: It will override the default highlight schemes supported by visual studio code if you active this extension.

