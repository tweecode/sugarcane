copy /B %~dp0*.js %~dp0temp.js

findstr /V "console.log" %~dp0temp.js > temp2.js
java -jar "c:\program files\yui\compressor.jar" -o %~dp0compressed.js %~dp0temp2.js
java -jar "c:\program files\yui\compressor.jar" -o %~dp0compressed.css %~dp0style.css
:: del %~dp0temp*.js 
