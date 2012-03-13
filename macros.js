//
// Jonah macros
//
// These provide various facilities to stories.
//

// <<back>>

version.extensions.backMacro = {major: 1, minor: 0, revision: 0};

macros['back'] = 
{
    handler: function (place, name, params)
    {
        var hash = '';

        if (params[0]) {
            for (var i = 0; i < state.history.length; i++) {
                if (state.history[i].passage.title == params[0])
                {
                    hash = state.history[i].hash;
                    break;
                }
            }
        } else {
            if (state.history[1]) {
                hash = state.history[1].hash;
            } else {
                throwError(place, "can't go back from the first passage read");
                return;
            };
        }

        if (hash == '')
        {
            throwError(place, "can't find passage \"" + params[0] + '" in history');
            return;
        };

        el = document.createElement('a');
        el.className = 'back';
        el.href = hash;
        el.innerHTML = '<b>&laquo;</b> Back';
        place.appendChild(el);
    }
};

// <<display>>

version.extensions.displayMacro = {major: 1, minor: 0, revision: 0};

macros['display'] =
{
	handler: function (place, name, params)
	{
		console.log('<<display>>ing "' + params[0] + '"');
		new Wikifier(place, tale.get(params[0]).text);
		console.log('<<display>> of "' + params[0] + '" complete');
	}
};

// <<actions>>

version.extensions.actionsMacro = { major: 1, minor: 2, revision: 0 };

macros['actions'] =
{
	handler: function (place, macroName, params)
	{
		var list = insertElement(place, 'ul');
		
		if (! state.history[0].variables['actions clicked'])
			state.history[0].variables['actions clicked'] = {};
		
		for (var i = 0; i < params.length; i++)
		{
			if (state.history[0].variables['actions clicked'][params[i]])
				continue;
					
			var item = insertElement(list, 'li');
			var link = Wikifier.createInternalLink(item, params[i]);
			insertText(link, params[i]);
			
			// rewrite the function in the link
					
			link.onclick = function()
			{
				state.history[0].variables['actions clicked'][this.id] = true;
				state.display(this.id, link);
			};
		};
	}
};

// <<print>>

version.extensions.printMacro = { major: 1, minor: 1, revision: 0 };

macros['print'] =
{
	handler: function (place, macroName, params, parser)
	{		
		try
		{
			var output = eval(parser.fullArgs());
			if (output)
				new Wikifier(place, output.toString());
		}
		catch (e)
		{
			throwError(place, 'bad expression: ' + e.message);
		}
	}
};

// <<set>>

version.extensions.setMacro = { major: 1, minor: 1, revision: 0 };

macros['set'] = 
{  
  handler: function (place, macroName, params, parser)
  {
  	macros['set'].run(parser.fullArgs());
  },
  
  run: function (expression)
  {
  	// you may call this directly from a script passage
  	
  	try
  	{
	  	return eval(Wikifier.parse(expression));
  	}
  	catch (e)
  	{
  		throwError(place, 'bad expression: ' + e.message);
  	};
  }
};

// <<if>>, <<else>>, and <<endif>>

version.extensions['ifMacros'] = { major: 1, minor: 0, revision: 0};

macros['if'] =
{
	handler: function (place, macroName, params, parser)
	{
		var condition = parser.fullArgs();
		var srcOffset = parser.source.indexOf('>>', parser.matchStart) + 2;
		var src = parser.source.slice(srcOffset);
		var endPos = -1;
		var trueClause = '';
		var falseClause = '';
		
		for (var i = 0, nesting = 1, currentClause = true; i < src.length; i++)
		{
			if (src.substr(i, 9) == '<<endif>>')
			{
				nesting--;
								
				if (nesting == 0)
				{
					endPos = srcOffset + i + 9; // length of <<endif>>
					break;
				}
			}
			
			if ((src.substr(i, 8) == '<<else>>') && (nesting == 1))
			{
				currentClause = 'false';
				i += 8;
			}
			
			if (src.substr(i, 5) == '<<if ')
				nesting++;
						
			if (currentClause == true)
				trueClause += src.charAt(i);
			else
				falseClause += src.charAt(i);
		};
		
		// display the correct clause
		
		try
		{
			if (eval(condition))
				new Wikifier(place, trueClause.trim());
			else
				new Wikifier(place, falseClause.trim());
		
			// push the parser past the entire expression
					
			if (endPos != -1)
				parser.nextMatch = endPos;
			else
				throwError(place, "can't find matching endif");
		}
		catch (e)
		{
			throwError(place, 'bad condition: ' + e.message);
		};
	}
};

macros['else'] = macros['endif'] = { handler: function() {} };

// <<remember>>

version.extensions.rememberMacro = {major: 1, minor: 1, revision: 0};

macros['remember'] =
{
	handler: function (place, macroName, params, parser)
	{
		var statement = parser.fullArgs();
		var expire = new Date();
		var variable, value;

		// evaluate the statement if any
		
		macros['set'].run(statement);
		
		// find the variable to save
		
		var variableSigil = Wikifier.parse('$');
		variableSigil = variableSigil.replace('[', '\\[');
		variableSigil = variableSigil.replace(']', '\\]');
		variable = statement.match(new RegExp(variableSigil + '(\\w+)', 'i'))[1];
		value = eval(Wikifier.parse('$' + variable));
						
		// simple JSON-like encoding
		
		switch (typeof value)
		{
			case 'string':
			value = '"' + value.replace(/"/g, '\\"') + '"';
			break;
			
			case 'number':
			case 'boolean':
			break;
			
			default:
			throwError(place, "can't remember $" + variable + ' (' + (typeof value) +
								 ')');
			return;
		};
		
		// save the variable as a cookie
		
		expire.setYear(expire.getFullYear() + 1);
		document.cookie = macros['remember'].prefix + variable +
											'=' + value + '; expires=' + expire.toGMTString();
	},
	
	init: function()
	{	
		// figure out our cookie prefix
		
		if (tale.has('StoryTitle'))
			macros['remember'].prefix = tale.get('StoryTitle').text + '_';
		else
			macros['remember'].prefix = '__jonah_';
	
		// restore all cookie'd values to local variables
		
		var cookies = document.cookie.split(';');
		
		for (var i = 0; i < cookies.length; i++)
		{
			var bits = cookies[i].split('=');
			
			if (bits[0].trim().indexOf(this.prefix) == 0)
			{
				// replace our cookie prefix with $ and evaluate the statement
				
				var statement = cookies[i].replace(this.prefix, '$');
				eval(Wikifier.parse(statement));
			};
		}
	}
};

// <<silently>>

version.extensions['SilentlyMacro'] = { major: 1, minor: 0, revision: 0 };

macros['silently'] =
{
	handler: function (place, macroName, params, parser)
	{
		var buffer = insertElement(null, 'div');
		var srcOffset = parser.source.indexOf('>>', parser.matchStart) + 2;
		var src = parser.source.slice(srcOffset);
		var endPos = -1;
		var silentText = '';

		for (var i = 0; i < src.length; i++)
		{
			if (src.substr(i, 15) == '<<endsilently>>')
				endPos = srcOffset + i + 15;
			else
				silentText += src.charAt(i);
		};
		
		if (endPos != -1)
		{
			new Wikifier(buffer, silentText);
			parser.nextMatch = endPos;
		}
		else
			throwError(place, "can't find matching endsilently");
		
		delete buffer;
	}
};

macros['endsilently'] =
{
	handler: function() { }
};

// <<choice>> stub

version.extensions.choiceMacro = {major: 1, minor: 0, revision: 0};

macros['choice'] =
{
	handler: function(place, macroName, params)
	{
		Wikifier.createInternalLink(place, params[0]);
	}
};
