//
// Class: History
//
// A class used to manage the state of the story -- displaying new passages
// and rewinding to the past.
//
// Property: History
// An array representing the state of the story. history[0] is the current
// state, history[1] is the state just before the present, and so on.
// Each entry in the history is an object with two properties.
//
// *passage* corresponds to the <Passage> just displayed.
//
// *variables* is in itself an object. Each property is a variable set
// by the story via the <<set>> macro.
//
// *hash* is a URL hash guaranteed to load that specific point in time.
//

//
// Constructor: History
// Initializes a History object.
// 
// Parameters:
// none
//

function History()
{
	this.history = [{ passage: null, variables: {}, hash: null }];
};

//
// Method: init
// This first attempts to restore the state of the story via the <restore>
// method. If that fails, it then either displays the passages linked in the
// *StartPassages* passage, or gives up and tries to display a passage
// named *Start*.
//
// Parameters:
// none
//
// Returns:
// nothing
//

History.prototype.init = function()
{
	var self = this;

	if (! this.restore())
		this.display('Start', null);
	
	this.hash = window.location.hash;
	this.interval = window.setInterval(function() { self.watchHash.apply(self) }, 250);
};

//
// Method: display
// Displays a passage on the page.
//
// Parameters:
// title - the title of the passage to display.
// link - the DOM element corresponding to the link that was clicked to
// view the passage. This parameter has no effect but is maintained
// for Jonah compatibility.
// render - may be either "quietly" or "offscreen". If a "quietly" value
// is passed, the passage's appearance is not animated. "offscreen"
// asks that the passage be rendered, but not displayed at all. This
// parameter is optional. If it is omitted, then the passage's appearance
// is animated.
//
// Returns:
// The DOM element containing the passage on the page.
//

History.prototype.display = function (title, link, render)
{	
	console.log('displaying "' + title + '" ' + (render || '') + ' from ', link);	
	
	// create a fresh entry in the history
	
	var passage = tale.get(title);
	
	this.history.unshift({ passage: passage, variables: clone(this.history[0].variables) } );
	this.history[0].hash = this.save();
	
	// add it to the page
	
	var div = passage.render();
	
	if (render != 'offscreen')
	{
		removeChildren($('passages'));			
		$('passages').appendChild(div);
		
		// animate its appearance
		
		if (render != 'quietly')
			fade(div, { fade: 'in' });
	}
	
	if ((render == 'quietly') || (render == 'offscreen'))
		div.style.visibility = 'visible';
	
	if (render != 'offscreen')
	{
		document.title = tale.title;
		this.hash = this.save();
	
		if (passage.title != 'Start')
		{
			document.title += ': ' + passage.title;
			window.location.hash = this.hash;
		};
		
		window.scroll(0, 0);
	};
	
	return div;	
};

//
// Method: restart
// Restarts the story from the beginning. This actually forces the
// browser to refresh the page.
//
// Parameters:
// none
//
// Returns:
// none
//

History.prototype.restart = function()
{
	// clear any bookmark
	// this has the side effect of forcing a page reload
	// (in most cases)
	
	window.location.hash = '';
};

//
// Method: save
// Appends a hash to the page's URL that will be later
// read by the <restore> method. How this is generated is not
// guaranteed to remain constant in future releases -- but it
// is guaranteed to be understood by <restore>.
//
// Parameters:
// none
//
// Returns:
// nothing
//

History.prototype.save = function (passage)
{
	var order = '';

	// encode our history
	
	for (var i = this.history.length - 1; i >= 0; i--)
	{
		if ((this.history[i].passage) && (this.history[i].passage.id))
			order += this.history[i].passage.id.toString(36) + '.';
	};
	
	// strip the trailing period
	
	return '#' + order.substr(0, order.length - 1);
};

//
// Method: restore
// Attempts to restore the state of the story as saved by <save>.
//
// Parameters:
// none
//
// Returns:
// Whether this method actually restored anything.
//

History.prototype.restore = function ()
{
	try
	{
		if ((window.location.hash == '') || (window.location.hash == '#'))
			return false;
	
		var order = window.location.hash.replace('#', '').split('.');
		var passages = [];
		
		// render the passages in the order the reader clicked them
		// we only show the very last one
		
		for (var i = 0; i < order.length; i++)
		{
			var id = parseInt(order[i], 36);
			
			if (! tale.has(id))
				return false;
			
			console.log('restoring id ' + id);	
			
			var method = (i == order.length - 1) ? '' : 'offscreen';
			passages.unshift(this.display(id, null, method));
		};
		
		return true;
	}
	catch (e)
	{
		console.log("restore failed", e);
		return false;
	};
};

//
// Method: watchHash
// Watches the browser's address bar for changes in its hash, and
// calls <restore> accordingly. This is set to run at an interval
// in <init>.
//
// Parameters:
// none
//
// Returns:
// nothing
//

History.prototype.watchHash = function()
{
	if (window.location.hash != this.hash)
	{	
		console.log('new hash: ' + window.location.hash + ', was ' + this.hash);
				
		if ((window.location.hash != '') && (window.location.hash != '#'))
		{
			this.history = [{ passage: null, variables: {} }];
			removeChildren($('passages'));
			
			$('passages').style.visibility = 'hidden';
			
			if (! this.restore())
				alert('The passage you had previously visited could not be found.');
			
			$('passages').style.visibility = 'visible';
		}
		else
			window.location.reload();
		
		this.hash = window.location.hash;
	}
};

