//
// Class: Tale
//
// Used to provide access to passages. This is analogous to the
// TiddlyWiki class in the core TiddlyWiki code.
//
// Property: passages
// An associative array of <Passage> objects in the story.
// The key for this array is the title of the passage.
//

//
// Constructor: Tale
//
// Initializes a new Tale object with the contents of the
// DOM element with the id *storeArea*, constructing new <Passage>s
// as it traverses the tree.
//
// Parameters:
// none
//

function Tale()
{	
	this.passages = {};

	if (document.normalize)
		document.normalize();
		
	var store = $('storeArea').childNodes;
	
	for (var i = 0; i < store.length; i++)
	{
		var el = store[i];
				
		if (el.getAttribute && (tiddlerTitle = el.getAttribute('tiddler')))
			this.passages[tiddlerTitle] = new Passage(tiddlerTitle, el, i);
	};
	
	this.title = 'Sugarcane';
	
	if (this.passages['StoryTitle'])
		this.title = this.passages['StoryTitle'].text;
};

//
// Method: has
//
// Checks whether the tale has a passage with either the title
// passed (if the key parameter is a string) or an id (if
// a number is passed instead).
//
// Parameters:
// key - the title or id of the passage to search for
//
// Returns:
// boolean
//

Tale.prototype.has = function (key)
{
	// returns whether a passage exists
		
	if (typeof key == 'string')
		return (this.passages[key] != null);
	else
	{
		for (i in this.passages)			
			if (this.passages[i].id == key)
				return true;
				
		return false;
	};
};

//
// Method: get
//
// A getter function that returns a certain <Passage> object belonging
// to the tale. You may either retrieve a passage by its title or id.
//
// Parameters:
// key - the title or id of the passage to retrieve
//
// Returns:
// A <Passage> object. If no passage exists matching the passed key,
// a null value is returned.
//
// See also:
// <Tale.lookup>
//

Tale.prototype.get = function (key)
{
	// returns a passage either by title or its id

	if (typeof key == 'string')
		return this.passages[key] || new Passage(key);
	else		
		for (i in this.passages)
			if (this.passages[i].id == key)
				return this.passages[i];
};

//
// Method: lookup
//
// Searches the Tale for all passages matching a certain criteria.
// You may optionally specify a secondary field to sort the results on.
//
// Parameters:
// field - the name of the <Passage> property to search on
// value - the value to match
// sortField - the name of the <Passage> property to sort matches on.
// This always sorts in descending order. If you need ascending order,
// use the Array class's reverse() method.
//
// Returns:
// An array of <Passage>s. If no passages met the search criteria,
// an empty array is returned.
//
// See also:
// <Tale.get>
//

Tale.prototype.lookup = function(field, value, sortField)
{
	var results = [];
	for (var t in this.passages)
	{
		var passage = this.passages[t];
		var found = false;
		
		for (var i = 0; i < passage[field].length; i++)
			if (passage[field][i] == value)
				results.push(passage);
	}

	if (! sortField)
		sortField = 'title';

	results.sort(function (a,b) {if(a[sortField] == b[sortField]) return(0); else return (a[sortField] < b[sortField]) ? -1 : +1; });
	
	return results;
};

//
// Method: reset
//
// Calls the <Passage.reset> method on all <Passage>s in the tale, restoring
// the story to its initial state.
//
// Parameters:
// none
//
// Returns:
// nothing
//

Tale.prototype.reset = function()
{
	console.log('resetting all passages');
	
	for (i in this.passages)
		this.passages[i].reset();
};
