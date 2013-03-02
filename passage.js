//
// Class: Passage
//
// This class represents an individual passage.
// This is analogous to the Tiddler class in the core TiddlyWiki code.
//
// Property: title
// The title of the passage, displayed at its top.
//
// Property: id
// An internal id of the passage. This is never seen by the reader,
// but it is used by the <History> class.
//
// Property: initialText
// The initial text of the passage. This is used by the reset method.
//
// Property: text
// The current text of the passage. This is usually the same as
// the <initialText> property, though macros such as <<choice>>
// may alter it.
//
// Property: tags
// An array of strings, each corresponding to a tag the passage belongs to.
//

//
// Constructor: Passage
//
// Initializes a new Passage object. You may either call this with
// a DOM element, which creates the passage from the text stored in the
// element, or you may pass only a title, 
//
// Parameters:
// title - the title of the passage to create. This parameter is required.
// el - the DOM element storing the content of the passage.
// This parameter is optional. If it is omitted, "this passage does not
// exist" is used as the passage's content.
// order - the order in which this passage was retrieved from the
// document's *storeArea* div. This is used to generate the passage's id.
// This parameter is optional, but should be included if el is specified.
//

function Passage (title, el, order)
{	
	this.title = title;

	if (el)
	{
		this.id = order;	
		this.initialText = this.text = Passage.unescapeLineBreaks(el.firstChild ? el.firstChild.nodeValue : "");
		this.tags = el.getAttribute("tags");
		
		if (typeof this.tags == 'string')
			this.tags = this.tags.readBracketedList();
		else
			this.tags = [];
	}
	else
	{
		this.initialText = this.text = '@@This passage does not exist.@@';
		this.tags = [];
	};
};

//
// Method: render
// 
// Renders the passage to a DOM element, including its title, toolbar,
// and content. It's up to the caller to add this to the DOM tree appropriately
// and animate its appearance.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Passage.prototype.render = function()
{
	// construct passage
	
	var passage = insertElement(null, 'div', 'passage' + this.title.split(' ').join('_'), 'passage');
	passage.style.visibility = 'hidden';
	
	insertElement(passage, 'div', '', 'header');
		
	var body = insertElement(passage, 'div', '', 'content');
	new Wikifier(body, this.text);
	
	insertElement(passage, 'div', '', 'footer');
	
	console.log(passage);
	
	return passage;
};

//
// Method: reset
// 
// Resets the passage's <text> property to its <initialText> property.
// This does not directly affect anything displayed on the page.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Passage.prototype.reset = function()
{
	console.log('resetting "' + this.title + '"');
	this.text = this.initialText;
};

//
// Method: excerpt
//
// Returns a brief excerpt of the passage's content.
//
// Parameters:
// none
//
// Returns:
// a string excerpt
//

Passage.prototype.excerpt = function()
{
	var text = this.text.replace(/<<.*?>>/g, '');
	text = text.replace(/!.*?\n/g, '');
	text = text.replace(/[\[\]\/]/g, '');
	var matches = text.match(/(.*?\s.*?\s.*?\s.*?\s.*?\s.*?\s.*?)\s/);
	return matches[1] + '...';
};

//
// Method: unescapeLineBreaks
// 
// A static function used by the constructor to convert string literals
// used by TiddlyWiki to indicate newlines into actual newlines.
//
// Parameters:
// text - a string to unescape
//
// Returns:
// a converted string
//

Passage.unescapeLineBreaks = function (text)
{
	if(text && text != "")
		return text.replace(/\\n/mg,"\n").replace(/\\/mg,"\\").replace(/\r/mg,"");
	else
		return "";
};
