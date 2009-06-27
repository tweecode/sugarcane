Interface =
{
	init: function()
	{
		console.log('Interface.init()');	
		main();
		$('snapback').onclick = Interface.showSnapback;
		$('restart').onclick = Interface.restart;
		$('share').onclick = Interface.showShare;
	},
	
	restart: function()
	{
		if (confirm('Are you sure you want to restart this story?'))
			state.restart();
	},
	
	showShare: function (event)
	{
		Interface.hideAllMenus();
		Interface.showMenu(event, $('shareMenu'))
	},
	
	showSnapback: function (event)
	{
		Interface.hideAllMenus();
		Interface.buildSnapback();
		Interface.showMenu(event, $('snapbackMenu'));
	},
	
	buildSnapback: function()
	{
		var hasItems = false;
		
		removeChildren($('snapbackMenu'));
	
		for (var i = state.history.length - 1; i >= 0; i--)
			if (state.history[i].passage &&
					state.history[i].passage.tags.indexOf('bookmark') != -1)
			{
				var el = document.createElement('div');
				el.hash = state.history[i].hash;
				el.onclick = function() { window.location.hash = this.hash };
				el.innerHTML = state.history[i].passage.excerpt();
				$('snapbackMenu').appendChild(el);
				hasItems = true;
			};
			
		if (! hasItems)
		{
			var el = document.createElement('div');
			el.innerHTML = '<i>No passages available</i>';
			$('snapbackMenu').appendChild(el);
		};
	},
	
	hideAllMenus: function()
	{
		$('shareMenu').style.display = 'none';	
		$('snapbackMenu').style.display = 'none';	
	},
	
	showMenu: function (event, el)
	{
		if (! event)
			event = window.event;
	
		var pos = { x: 0, y: 0 };

		if (event.pageX || event.pageY)
		{
			pos.x = event.pageX;
			pos.y = event.pageY;
		}
		else
			if (event.clientX || event.clientY)
			{
			pos.x = event.clientX + document.body.scrollLeft
  					 	+ document.documentElement.scrollLeft;
			pos.y = event.clientY + document.body.scrollTop
							+ document.documentElement.scrollTop;
			};
			
		el.style.top = pos.y + 'px';
		el.style.left = pos.x + 'px';
		el.style.display = 'block';
		document.onclick = Interface.hideAllMenus;
		event.cancelBubble = true;

		if (event.stopPropagation)
			event.stopPropagation();		
	}
};

window.onload = Interface.init;

