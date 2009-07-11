//
// Section: General-purpose functions
//

//
// Function: $
// Returns the DOM element with the id passed.
//
// Parameters:
// id - the id to look up
//
// Returns:
// A DOM element, or null if none with the id exist.
//

function $ (id)
{
	if (typeof id == 'string')
		return document.getElementById(id);
	else
		return id;	
}

//
// Function: clone
// Performs a shallow copy of an object.
//
// Parameters:
// original - the object to copy
//
// Returns:
// The copied object.
//

function clone (original)
{
	var clone = {};

	for (property in original)
		clone[property] = original[property];
	
	return clone;
};

//
// Function: insertElement
// A shortcut function for creating a DOM element. All parameters are
// optional.
//
// Parameters:
// place - the parent element
// type - the type of element to create -- e.g. 'div' or 'span'
// id - the id to give the element
// className - the CSS class to give the element
// text - text to place inside the element. This is *not* interpreted
//				as HTML.
//
// Returns:
// The newly created element.
//

function insertElement (place, type, id, className, text)
{
	var el = document.createElement(type);
	
	if (id)
		el.id = id;

	if (className)
		el.className = className;
	
	if (text)
		insertText(el, text);
		
	if (place)
		place.appendChild(el);
		
	return el;
};

//
// Function: insertText
// Places text in a DOM element.
//
// Parameters:
// place - the element to add text to
// text - text to insert
//
// Returns:
// The newly created DOM text node.
//

function insertText (place, text)
{
	return place.appendChild(document.createTextNode(text));
};

//
// Function: removeChildren
// Removes all child elements from a DOM element.
//
// Parameters:
// el - the element to strip
//
// Returns:
// nothing
//

function removeChildren (el)
{
	while (el.hasChildNodes())
		el.removeChild(el.firstChild);
};

//
// Function: setPageElement
// Wikifies a passage into a DOM element.
//
// Parameters:
// id - the id of the element
// title - the title of the passage
// defaultText - text to use if the passage doesn't exist
//
// Returns:
// a DOM element, or null if none with the id exist.
//
// See also:
// <Wikifier>
//

function setPageElement (id, title, defaultText)
{	
	if (place = $(id))
	{
		removeChildren(place);
		
		if (tale.has(title))
			new Wikifier(place, tale.get(title).text);
		else
			new Wikifier(place, defaultText);
	};
};

//
// Function: addStyle
// Adds CSS styles to the document.
//
// Parameters:
// source - the CSS styles to add
//
// Returns:
// nothing
//

function addStyle (source)
{
	if (document.createStyleSheet) 
	{
		document.getElementsByTagName('head')[0].insertAdjacentHTML('beforeEnd', '&nbsp;<style>' + source + '</style>');
	}
	else
	{
		var el = document.createElement("style");
		el.type = "text/css";
		el.appendChild(document.createTextNode(source));
		document.getElementsByTagName("head")[0].appendChild(el);
	}
};

//
// Function: throwError
// Displays an error message on the page.
//
// Parameters:
// place - the place to show the error message
// message - the message to display
//
// Returns:
// nothing
//

function throwError (place, message)
{
	new Wikifier(place, "'' @@ " + message + " @@ ''");
};

//
// Function: Math.easeInOut
// Eases a decimal number from 0 to 1.
//
// Parameters:
// i - the number to ease. Must be between 0 and 1.
//
// Returns:
// The eased value.
//

Math.easeInOut = function (i)
{
	return(1-((Math.cos(i * Math.PI)+1)/2));	
};

//
// Function: String.readMacroParams
// Parses a list of macro parameters.
//
// Parameters:
// none
//
// Returns:
// An array of parameters.
//

String.prototype.readMacroParams = function()
{
	var regexpMacroParam = new RegExp("(?:\\s*)(?:(?:\"([^\"]*)\")|(?:'([^']*)')|(?:\\[\\[([^\\]]*)\\]\\])|([^\"'\\s]\\S*))","mg");
	var params = [];
	do {
		var match = regexpMacroParam.exec(this);
		if(match)
			{
			if(match[1]) // Double quoted
				params.push(match[1]);
			else if(match[2]) // Single quoted
				params.push(match[2]);
			else if(match[3]) // Double-square-bracket quoted
				params.push(match[3]);
			else if(match[4]) // Unquoted
				params.push(match[4]);
			}
	} while(match);
	return params;
}

//
// Function: String.readBracketedList
// Parses a list of bracketed links -- e.g. *[[my link]]*.
//
// Parameters:
// none
//
// Returns:
// an array of link titles.
//

String.prototype.readBracketedList = function()
{
	var bracketedPattern = "\\[\\[([^\\]]+)\\]\\]";
	var unbracketedPattern = "[^\\s$]+";
	var pattern = "(?:" + bracketedPattern + ")|(" + unbracketedPattern + ")";
	var re = new RegExp(pattern,"mg");
	var tiddlerNames = [];
	do {
		var match = re.exec(this);
		if(match)
			{
			if(match[1]) // Bracketed
				tiddlerNames.push(match[1]);
			else if(match[2]) // Unbracketed
				tiddlerNames.push(match[2]);
			}
	} while(match);
	return(tiddlerNames);
}

//
// Function: String.trim
// Removes whitespace from the beginning and end of a string.
//
// Parameters:
// none
//
// Returns:
// The trimmed string.
//

String.prototype.trim = function()
{
	return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

//
// Function: Array.indexOf
// Works like String.indexOf.
//

Array.prototype.indexOf || (Array.prototype.indexOf = function(v,n){
  n = (n==null)?0:n; var m = this.length;
  for(var i = n; i < m; i++)
    if(this[i] == v)
       return i;
  return -1;
});
