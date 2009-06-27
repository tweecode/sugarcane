//
// Initialization
//

var version =
{
	major: 2, minor: 0, revision: 0,
	date: new Date('July 30, 2007'),
	extensions: {}
};

// passage storage and story history
var tale, state;

// Macros
var macros = {};

//
// Function: main
//
// Loads the story from the storage div, initializes macros and
// custom stylesheets, and displays the first passages of the story.
//
// Returns:
// nothing
// 

function main()
{	
	tale = new Tale();
	document.title = tale.title;

	setPageElement('storyTitle', 'StoryTitle', 'Untitled Story');
	
	if (tale.has('StoryAuthor'))
	{
		$('titleSeparator').innerHTML = '<br />';
		setPageElement('storyAuthor', 'StoryAuthor', '');
	};
	
	if (tale.has('StoryMenu'))
	{
		$('storyMenu').style.display = 'block';
		setPageElement('storyMenu', 'StoryMenu', '');
	};

	// initialize macros
	
	for (macro in macros)
		if (typeof macro.init == 'function')
			macro.init();
	
	// process passages tagged 'stylesheet'
	
	var styles = tale.lookup('tags', 'stylesheet');
	
	for (var i = 0; i < styles.length; i++)
		addStyle(styles[i].text);
		
	// process passages tagged 'script'
	
	var scripts = tale.lookup('tags', 'script');
		
	for (var i = 0; i < scripts.length; i++)
		try
		{
			 eval(scripts[i].text);
		}
		catch (e)
		{		
			alert('There is a technical problem with this story (' +
						scripts[i].title + ': ' + e.message + '). You may be able ' +
						'to continue reading, but all parts of the story may not ' +
						'work properly.');

		};
			
	// initialize history and display initial passages
	
	state = new History();
	state.init();
		
	console.log('init complete', tale, state);
}
