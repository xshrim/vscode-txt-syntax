Txt Syntax extension is aimed to highlight several text files and fold between sections.

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

Section headers like these(Section ended with `---` or another header):

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


**note**: It will override the default highlight schemes supported by visual studio code if you active this extension.

