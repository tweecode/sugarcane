test:	*.js *.css
	twee -t none test.tw | cat testheader.html - > test.html
	
release: *.js *.css
	rm -f compressed.js
	cat *.js > temp1.js
	grep -v 'console.log' temp1.js > temp2.js
	packjs.yui temp2.js > compressed.js
	packcss.yui *.css > compressed.css
	rm -f temp1.js temp2.js
