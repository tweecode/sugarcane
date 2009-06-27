//
// Class: Wikifier
//
// Used to display text on the page. This is taken more or less verbatim
// from the TiddlyWiki core code, though not all formatters are available
// (notably the WikiWord link).
// 


//
// Constructor: Wikifier
// Wikifies source text into a DOM element. Any pre-existing contents are
// appended to. This should be used in place of TiddlyWiki's wikify()
// function.
//
// Parameters:
// place - the DOM element to render into 
// source - the source text to render
//
// Returns:
// nothing
//

function Wikifier(place, source)
{
	this.source = source;
	this.output = place;
	this.nextMatch = 0;
	this.assembleFormatterMatches(Wikifier.formatters);

	this.subWikify(this.output);
};

Wikifier.prototype.assembleFormatterMatches = function (formatters)
{
	this.formatters = [];
	var pattern = [];

	for(var n = 0; n < formatters.length; n++)
	{
		pattern.push("(" + formatters[n].match + ")");
		this.formatters.push(formatters[n]);
	};
		
	this.formatterRegExp = new RegExp(pattern.join("|"),"mg");
};

Wikifier.prototype.subWikify = function (output, terminator)
{
	// Temporarily replace the output pointer
	
	var oldOutput = this.output;
	this.output = output;
	
	// Prepare the terminator RegExp
	
	var terminatorRegExp = terminator ? new RegExp("(" + terminator + ")","mg") : null;
	do
	{
		// Prepare the RegExp match positions
	
		this.formatterRegExp.lastIndex = this.nextMatch;
		
		if(terminatorRegExp)
			terminatorRegExp.lastIndex = this.nextMatch;
		
		// Get the first matches
		
		var formatterMatch = this.formatterRegExp.exec(this.source);
		var terminatorMatch = terminatorRegExp ? terminatorRegExp.exec(this.source) : null;
		
		// Check for a terminator match
		
		if (terminatorMatch && (!formatterMatch || terminatorMatch.index <= formatterMatch.index))
		{
			// Output any text before the match

			if(terminatorMatch.index > this.nextMatch)
				this.outputText(this.output,this.nextMatch,terminatorMatch.index);

			// Set the match parameters

			this.matchStart = terminatorMatch.index;
			this.matchLength = terminatorMatch[1].length;
			this.matchText = terminatorMatch[1];
			this.nextMatch = terminatorMatch.index + terminatorMatch[1].length;

			// Restore the output pointer and exit

			this.output = oldOutput;
			return;		
		}
		// Check for a formatter match
		else if (formatterMatch)
			{
			// Output any text before the match
			
			if (formatterMatch.index > this.nextMatch)
				this.outputText(this.output,this.nextMatch,formatterMatch.index);
				
			// Set the match parameters
			
			this.matchStart = formatterMatch.index;
			this.matchLength = formatterMatch[0].length;
			this.matchText = formatterMatch[0];
			this.nextMatch = this.formatterRegExp.lastIndex;
			
			// Figure out which formatter matched
			
			var matchingformatter = -1;
			for (var t = 1; t < formatterMatch.length; t++)
				if (formatterMatch[t])
					matchingFormatter = t-1;
					
			// Call the formatter
			
			if (matchingFormatter != -1)
				this.formatters[matchingFormatter].handler(this);
			}
	}
	while (terminatorMatch || formatterMatch);
	
	// Output any text after the last match
	
	if(this.nextMatch < this.source.length)
	{
		this.outputText(this.output,this.nextMatch,this.source.length);
		this.nextMatch = this.source.length;
	};

	// Restore the output pointer
	this.output = oldOutput;
};

Wikifier.prototype.outputText = function(place, startPos, endPos)
{
	insertText(place, this.source.substring(startPos,endPos));
};

//
// Method: fullArgs
// Meant to be called by macros, this returns the text
// passed to the currently executing macro. Unlike TiddlyWiki's
// default mechanism, this does not attempt to split up the arguments
// into an array, thought it does do some magic with certain Twee operators
// (like gt, eq, and $variable).
//
// Parameters:
// none
//
// Returns:
// a parsed string of arguments
//

Wikifier.prototype.fullArgs = function()
{
	var startPos = this.source.indexOf(' ', this.matchStart);
	var endPos = this.source.indexOf('>>', this.matchStart);
	
	return Wikifier.parse(this.source.slice(startPos, endPos));
};

Wikifier.parse = function (expression)
{
	var result = expression.replace(/\$/g, 'state.history[0].variables.');
	result = result.replace(/\beq\b/gi, ' == ');
	result = result.replace(/\bneq\b/gi, ' != ');
	result = result.replace(/\bgt\b/gi, ' > ');
	result = result.replace(/\beq\b/gi, ' == ');
	result = result.replace(/\bneq\b/gi, ' != ');
	result = result.replace(/\bgt\b/gi, ' > ');
	result = result.replace(/\bgte\b/gi, ' >= ');
	result = result.replace(/\blt\b/gi, ' < ');
	result = result.replace(/\blte\b/gi, ' <= ');
	result = result.replace(/\band\b/gi, ' && ');
	result = result.replace(/\bor\b/gi, ' || ');
	result = result.replace(/\bnot\b/gi, ' ! ');

	return result;
};



Wikifier.formatHelpers =
{
	charFormatHelper: function(w)
	{
		var e = insertElement(w.output,this.element);
		w.subWikify(e,this.terminator);
	},
	
	inlineCssHelper:  function(w)
	{
		var styles = [];
		var lookahead = "(?:(" + Wikifier.textPrimitives.anyLetter + "+)\\(([^\\)\\|\\n]+)(?:\\):))|(?:(" + Wikifier.textPrimitives.anyLetter + "+):([^;\\|\\n]+);)";
		var lookaheadRegExp = new RegExp(lookahead,"mg");
		var hadStyle = false;
		do {
			lookaheadRegExp.lastIndex = w.nextMatch;
			var lookaheadMatch = lookaheadRegExp.exec(w.source);
			var gotMatch = lookaheadMatch && lookaheadMatch.index == w.nextMatch;
			if(gotMatch)
				{
				var s,v;
				hadStyle = true;
				if(lookaheadMatch[1])
					{
					s = lookaheadMatch[1].unDash();
					v = lookaheadMatch[2];
					}
				else
					{
					s = lookaheadMatch[3].unDash();
					v = lookaheadMatch[4];
					}
				switch(s)
					{
					case "bgcolor": s = "backgroundColor"; break;
					}
				styles.push({style: s, value: v});
				w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
				}
		} while(gotMatch);
		return styles;
	},

	monospacedByLineHelper: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart)
			{
			var text = lookaheadMatch[1];
			
			// IE specific hack
			
			if (navigator.userAgent.indexOf("msie") != -1 && navigator.userAgent.indexOf("opera") == -1)
				text = text.replace(/\n/g,"\r");
			var e = insertElement(w.output,"pre",null,null,text);
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
			}
	}
};


Wikifier.formatters = [
{
	name: "table",
	match: "^\\|(?:[^\\n]*)\\|(?:[fhc]?)$",
	lookahead: "^\\|([^\\n]*)\\|([fhc]?)$",
	rowTerminator: "\\|(?:[fhc]?)$\\n?",
	cellPattern: "(?:\\|([^\\n\\|]*)\\|)|(\\|[fhc]?$\\n?)",
	cellTerminator: "(?:\\x20*)\\|",
	rowTypes: {"c": "caption", "h": "thead", "": "tbody", "f": "tfoot"},
	handler: function(w)
	{
		var table = insertElement(w.output,"table");
		w.nextMatch = w.matchStart;
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		var currRowType = null, nextRowType;
		var rowContainer, rowElement;
		var prevColumns = [];
		var rowCount = 0;
		do {
			lookaheadRegExp.lastIndex = w.nextMatch;
			var lookaheadMatch = lookaheadRegExp.exec(w.source);
			var matched = lookaheadMatch && lookaheadMatch.index == w.nextMatch;
			if(matched)
				{
				nextRowType = lookaheadMatch[2];
				if(nextRowType != currRowType)
					rowContainer = insertElement(table,this.rowTypes[nextRowType]);
				currRowType = nextRowType;
				if(currRowType == "c")
					{
					if(rowCount == 0)
						rowContainer.setAttribute("align","top");
					else
						rowContainer.setAttribute("align","bottom");
					w.nextMatch = w.nextMatch + 1;
					w.subWikify(rowContainer,this.rowTerminator);
					}
				else
					{
					rowElement = insertElement(rowContainer,"tr");
					this.rowHandler(w,rowElement,prevColumns);
					}
				rowCount++;
				}
		} while(matched);
	},
	rowHandler: function(w,e,prevColumns)
	{
		var col = 0;
		var currColCount = 1;
		var cellRegExp = new RegExp(this.cellPattern,"mg");
		do {
			cellRegExp.lastIndex = w.nextMatch;
			var cellMatch = cellRegExp.exec(w.source);
			matched = cellMatch && cellMatch.index == w.nextMatch;
			if(matched)
				{
				if(cellMatch[1] == "~")
					{
					var last = prevColumns[col];
					if(last)
						{
						last.rowCount++;
						last.element.setAttribute("rowSpan",last.rowCount);
						last.element.setAttribute("rowspan",last.rowCount);
						last.element.valign = "center";
						}
					w.nextMatch = cellMatch.index + cellMatch[0].length-1;
					}
				else if(cellMatch[1] == ">")
					{
					currColCount++;
					w.nextMatch = cellMatch.index + cellMatch[0].length-1;
					}
				else if(cellMatch[2])
					{
					w.nextMatch = cellMatch.index + cellMatch[0].length;;
					break;
					}
				else
					{
					var spaceLeft = false, spaceRight = false;
					w.nextMatch++;
					var styles = Wikifier.formatHelpers.inlineCssHelper(w);
					while(w.source.substr(w.nextMatch,1) == " ")
						{
						spaceLeft = true;
						w.nextMatch++;
						}
					var cell;
					if(w.source.substr(w.nextMatch,1) == "!")
						{
						cell = insertElement(e,"th");
						w.nextMatch++;
						}
					else
						cell = insertElement(e,"td");
					prevColumns[col] = {rowCount: 1, element: cell};
					lastColCount = 1;
					lastColElement = cell;
					if(currColCount > 1)
						{
						cell.setAttribute("colSpan",currColCount);
						cell.setAttribute("colspan",currColCount);
						currColCount = 1;
						}
					for(var t=0; t<styles.length; t++)
						cell.style[styles[t].style] = styles[t].value;
					w.subWikify(cell,this.cellTerminator);
					if(w.matchText.substr(w.matchText.length-2,1) == " ")
						spaceRight = true;
					if(spaceLeft && spaceRight)
						cell.align = "center";
					else if (spaceLeft)
						cell.align = "right";
					else if (spaceRight)
						cell.align = "left";
					w.nextMatch = w.nextMatch-1;
					}
				col++;
				}
		} while(matched);		
	}
},

{
	name: "rule",
	match: "^----$\\n?",
	handler: function(w)
	{
		insertElement(w.output,"hr");
	}
},

{
	name: "emdash",
	match: "--",
	handler: function(w)
	{
		var e = insertElement(w.output,"span");
		e.innerHTML = '&mdash;';
	}
},

{
	name: "heading",
	match: "^!{1,5}",
	terminator: "\\n",
	handler: function(w)
	{
		var e = insertElement(w.output,"h" + w.matchLength);
		w.subWikify(e,this.terminator);
	}
},

{
	name: "monospacedByLine",
	match: "^\\{\\{\\{\\n",
	lookahead: "^\\{\\{\\{\\n((?:^[^\\n]*\\n)+?)(^\\}\\}\\}$\\n?)",
	handler: Wikifier.formatHelpers.monospacedByLineHelper
},

{
	name: "monospacedByLineForPlugin",
	match: "^//\\{\\{\\{\\n",
	lookahead: "^//\\{\\{\\{\\n\\n*((?:^[^\\n]*\\n)+?)(\\n*^//\\}\\}\\}$\\n?)",
	handler: Wikifier.formatHelpers.monospacedByLineHelper
},

{
	name: "wikifyCommentForPlugin", 
	match: "^/\\*\\*\\*\\n",
	terminator: "^\\*\\*\\*/\\n",
	handler: function(w)
	{
		w.subWikify(w.output,this.terminator);
	}
},

{
	name: "quoteByBlock",
	match: "^<<<\\n",
	terminator: "^<<<\\n",
	handler: function(w)
	{
		var e = insertElement(w.output,"blockquote");
		w.subWikify(e,this.terminator);
	}
},

{
	name: "quoteByLine",
	match: "^>+",
	terminator: "\\n",
	element: "blockquote",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.match,"mg");
		var placeStack = [w.output];
		var currLevel = 0;
		var newLevel = w.matchLength;
		var t;
		do {
			if(newLevel > currLevel)
				{
				for(t=currLevel; t<newLevel; t++)
					placeStack.push(insertElement(placeStack[placeStack.length-1],this.element));
				}
			else if(newLevel < currLevel)
				{
				for(t=currLevel; t>newLevel; t--)
					placeStack.pop();
				}
			currLevel = newLevel;
			w.subWikify(placeStack[placeStack.length-1],this.terminator);
			insertElement(placeStack[placeStack.length-1],"br");
			lookaheadRegExp.lastIndex = w.nextMatch;
			var lookaheadMatch = lookaheadRegExp.exec(w.source);
			var matched = lookaheadMatch && lookaheadMatch.index == w.nextMatch;
			if(matched)
				{
				newLevel = lookaheadMatch[0].length;
				w.nextMatch += lookaheadMatch[0].length;
				}
		} while(matched);
	}
},

{
	name: "list",
	match: "^(?:(?:\\*+)|(?:#+))",
	lookahead: "^(?:(\\*+)|(#+))",
	terminator: "\\n",
	outerElement: "ul",
	itemElement: "li",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		w.nextMatch = w.matchStart;
		var placeStack = [w.output];
		var currType = null, newType;
		var currLevel = 0, newLevel;
		var t;
		do {
			lookaheadRegExp.lastIndex = w.nextMatch;
			var lookaheadMatch = lookaheadRegExp.exec(w.source);
			var matched = lookaheadMatch && lookaheadMatch.index == w.nextMatch;
			if(matched)
				{
				if(lookaheadMatch[1])
					newType = "ul";
				if(lookaheadMatch[2])
					newType = "ol";
				newLevel = lookaheadMatch[0].length;
				w.nextMatch += lookaheadMatch[0].length;
				if(newLevel > currLevel)
					{
					for(t=currLevel; t<newLevel; t++)
						placeStack.push(insertElement(placeStack[placeStack.length-1],newType));
					}
				else if(newLevel < currLevel)
					{
					for(t=currLevel; t>newLevel; t--)
						placeStack.pop();
					}
				else if(newLevel == currLevel && newType != currType)
					{
						placeStack.pop();
						placeStack.push(insertElement(placeStack[placeStack.length-1],newType));
					}
				currLevel = newLevel;
				currType = newType;
				var e = insertElement(placeStack[placeStack.length-1],"li");
				w.subWikify(e,this.terminator);
				}
		} while(matched);
	}
},

{
	name: "prettyLink",
	match: "\\[\\[",
	lookahead: "\\[\\[([^\\|\\]]*?)(?:(\\]\\])|(\\|(.*?)\\]\\]))",
	terminator: "\\|",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source)
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart && lookaheadMatch[2]) // Simple bracketted link
			{
			var link = Wikifier.createInternalLink(w.output,lookaheadMatch[1]);
			w.outputText(link,w.nextMatch,w.nextMatch + lookaheadMatch[1].length);
			w.nextMatch += lookaheadMatch[1].length + 2;
			}
		else if(lookaheadMatch && lookaheadMatch.index == w.matchStart && lookaheadMatch[3]) // Pretty bracketted link
			{
			var e;
			if(tale.has(lookaheadMatch[4]))
				e = Wikifier.createInternalLink(w.output,lookaheadMatch[4]);
			else
				e = Wikifier.createExternalLink(w.output,lookaheadMatch[4]);
			w.outputText(e,w.nextMatch,w.nextMatch + lookaheadMatch[1].length);
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
			}
	}
},

{
	name: "urlLink",
	match: "(?:http|https|mailto|ftp):[^\\s'\"]+(?:/|\\b)",
	handler: function(w)
	{
		var e = Wikifier.createExternalLink(w.output,w.matchText);
		w.outputText(e,w.matchStart,w.nextMatch);
	}
},

{
	name: "image",
	match: "\\[(?:[<]{0,1})(?:[>]{0,1})[Ii][Mm][Gg]\\[",
	lookahead: "\\[([<]{0,1})([>]{0,1})[Ii][Mm][Gg]\\[(?:([^\\|\\]]+)\\|)?([^\\[\\]\\|]+)\\](?:\\[([^\\]]*)\\]?)?(\\])",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source);
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart) // Simple bracketted link
			{
			var e = w.output;
			if (lookaheadMatch[5])
				{
				if (tale.has(lookaheadMatch[5]))
					e = Wikifier.createInternalLink(w.output,lookaheadMatch[5]);
				else
					e = Wikifier.createExternalLink(w.output,lookaheadMatch[5]);
				}
			var img = insertElement(e,"img");
			if(lookaheadMatch[1])
				img.align = "left";
			else if(lookaheadMatch[2])
				img.align = "right";
			if(lookaheadMatch[3])
				img.title = lookaheadMatch[3];
			img.src = lookaheadMatch[4];
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
			}
	}
},

{
	name: "macro",
	match: "<<",
	lookahead: "<<([^>\\s]+)(?:\\s*)([^>]*)>>",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source)
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart && lookaheadMatch[1])
			{
			var params = lookaheadMatch[2].readMacroParams();			
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
			try
				{
				var macro = macros[lookaheadMatch[1]];
				
				if (macro && macro.handler)
					macro.handler(w.output,lookaheadMatch[1],params,w);
				else
				{
					insertElement(w.output,"span",null,'marked','macro not found: ' + lookaheadMatch[1]);
				}
				}
			catch(e)
				{
				throwError(w.output, 'Error executing macro ' + lookaheadMatch[1] + ': ' + e.toString());
				}
			}
	}
},

{
	name: "html",
	match: "<[Hh][Tt][Mm][Ll]>",
	lookahead: "<[Hh][Tt][Mm][Ll]>((?:.|\\n)*?)</[Hh][Tt][Mm][Ll]>",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source)
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart)
			{
			var e = insertElement(w.output,"span");
			e.innerHTML = lookaheadMatch[1];
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
			}
	}
},

{
	name: "commentByBlock",
	match: "/%",
	lookahead: "/%((?:.|\\n)*?)%/",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source)
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart)
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
	}
},

{
	name: "boldByChar",
	match: "''",
	terminator: "''",
	element: "strong",
	handler: Wikifier.formatHelpers.charFormatHelper
},

{
	name: "strikeByChar",
	match: "==",
	terminator: "==",
	element: "strike",
	handler: Wikifier.formatHelpers.charFormatHelper
},

{
	name: "underlineByChar",
	match: "__",
	terminator: "__",
	element: "u",
	handler: Wikifier.formatHelpers.charFormatHelper
},

{
	name: "italicByChar",
	match: "//",
	terminator: "//",
	element: "em",
	handler: Wikifier.formatHelpers.charFormatHelper
},

{
	name: "subscriptByChar",
	match: "~~",
	terminator: "~~",
	element: "sub",
	handler: Wikifier.formatHelpers.charFormatHelper
},

{
	name: "superscriptByChar",
	match: "\\^\\^",
	terminator: "\\^\\^",
	element: "sup",
	handler: Wikifier.formatHelpers.charFormatHelper
},

{
	name: "monospacedByChar",
	match: "\\{\\{\\{",
	lookahead: "\\{\\{\\{((?:.|\\n)*?)\\}\\}\\}",
	handler: function(w)
	{
		var lookaheadRegExp = new RegExp(this.lookahead,"mg");
		lookaheadRegExp.lastIndex = w.matchStart;
		var lookaheadMatch = lookaheadRegExp.exec(w.source)
		if(lookaheadMatch && lookaheadMatch.index == w.matchStart)
			{
			var e = insertElement(w.output,"code",null,null,lookaheadMatch[1]);
			w.nextMatch = lookaheadMatch.index + lookaheadMatch[0].length;
			}
	}
},

{
	name: "styleByChar",
	match: "@@",
	terminator: "@@",
	lookahead: "(?:([^\\(@]+)\\(([^\\)]+)(?:\\):))|(?:([^:@]+):([^;]+);)",
	handler:  function(w)
	{
		var e = insertElement(w.output,"span",null,null,null);
		var styles = Wikifier.formatHelpers.inlineCssHelper(w);
		if(styles.length == 0)
			e.className = "marked";
		else
			for(var t=0; t<styles.length; t++)
				e.style[styles[t].style] = styles[t].value;
		w.subWikify(e,this.terminator);
	}
},

{
	name: "lineBreak",
	match: "\\n",
	handler: function(w)
	{
		insertElement(w.output,"br");
	}
}
];

Wikifier.textPrimitives =
{
	anyDigit: "[0-9]",
	anyNumberChar: "[0-9\\.E]",
	urlPattern: "(?:http|https|mailto|ftp):[^\\s'\"]+(?:/|\\b)"
};

//
// Method: createInternalLink
// Creates a link to a passage. It automatically classes it so that
// broken links appear broken.
//
// Parameters:
// place - the DOM element to render into
// title - the title of the passage to link to
//
// Returns:
// the newly created link as a DOM element
//

Wikifier.createInternalLink = function (place, title)
{
	var el = insertElement(place, 'a', title);
	el.href = 'javascript:void(0)';
	
	if (tale.has(title))
		el.className = 'internalLink';
	else
		el.className = 'brokenLink';
		
	el.onclick = function() { state.display(title, el) };
		
	if (place)
		place.appendChild(el);
		
	return el;
};

//
// Method: createExternalLink
// Creates a link to an external URL.
//
// Parameters:
// place - the DOM element to render into
// url - the URL to link to
//
// Returns:
// the newly created link as a DOM element
//

Wikifier.createExternalLink = function (place, url)
{	
	var el = insertElement(place, 'a');
	el.href = url;
	el.className = 'externalLink';
	el.target = '_blank';
		
	if (place)
		place.appendChild(el);
		
	return el;
};


// certain versions of Safari do not handle Unicode properly

if(! ((new RegExp("[\u0150\u0170]","g")).test("\u0150")))
{
	Wikifier.textPrimitives.upperLetter = "[A-Z\u00c0-\u00de]";
	Wikifier.textPrimitives.lowerLetter = "[a-z\u00df-\u00ff_0-9\\-]";
	Wikifier.textPrimitives.anyLetter = "[A-Za-z\u00c0-\u00de\u00df-\u00ff_0-9\\-]";
}
else
{
	Wikifier.textPrimitives.upperLetter = "[A-Z\u00c0-\u00de\u0150\u0170]";
	Wikifier.textPrimitives.lowerLetter = "[a-z\u00df-\u00ff_0-9\\-\u0151\u0171]";
	Wikifier.textPrimitives.anyLetter = "[A-Za-z\u00c0-\u00de\u00df-\u00ff_0-9\\-\u0150\u0170\u0151\u0171]";
};
